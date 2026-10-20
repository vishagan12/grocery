import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const startTime = Date.now();

  let dbHealthy = false;
  let latencyMs = 0;
  let featureFlags: Record<string, boolean> = {};

  try {
    // 1500ms timeout guard for health check query
    const timeoutPromise = new Promise<{ error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error('Database health check timeout (>1500ms)')), 1500)
    );

    const checkPromise = supabase
      .from('feature_flags')
      .select('key, enabled')
      .limit(4);

    const { data, error } = (await Promise.race([checkPromise, timeoutPromise])) as any;

    latencyMs = Date.now() - startTime;

    if (!error && Array.isArray(data)) {
      dbHealthy = true;
      for (const row of data) {
        if (row && row.key) {
          featureFlags[row.key] = Boolean(row.enabled);
        }
      }
    } else {
      // Fallback check on products table if feature_flags table is not yet migrated
      const fallbackCheck = await supabase.from('products').select('id').limit(1);
      if (!fallbackCheck.error) {
        dbHealthy = true;
      }
    }
  } catch (err: unknown) {
    latencyMs = Date.now() - startTime;
    const msg = err instanceof Error ? err.message : String(err);
    logger.warn('HEALTH_CHECK_DB_DEGRADED', msg, { latencyMs }, requestId);
  }

  const memoryUsage = process.memoryUsage ? process.memoryUsage() : null;
  const uptimeSeconds = process.uptime ? Math.floor(process.uptime()) : 0;

  const responsePayload = {
    status: dbHealthy ? 'healthy' : 'degraded',
    service: 'sri-amman-supermarket',
    timestamp: new Date().toISOString(),
    latencyMs,
    uptimeSeconds,
    featureFlags,
    memory: memoryUsage
      ? {
          heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024),
          heapTotalMb: Math.round(memoryUsage.heapTotal / 1024 / 1024),
          rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
        }
      : undefined,
  };

  const statusCode = dbHealthy ? 200 : 503;

  return NextResponse.json(responsePayload, {
    status: statusCode,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'x-request-id': requestId,
    },
  });
}
