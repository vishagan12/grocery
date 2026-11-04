import { NextRequest, NextResponse } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * RATE LIMITING CONFIGURATION
 * Sliding-window limits:
 * - Login (admin, rider): 5 attempts per 15 min per IP + username, then 15 min lockout
 * - Customer OTP send: 3 per 10 min per phone AND 10 per hour per IP
 * - Customer OTP verify: 5 per 10 min per phone
 * - Place order: 5 per minute per user
 * - Search and catalog: 60 per minute per IP
 * - Admin and rider APIs: 120 per minute per user
 * - Payment webhook: no per-IP limit (verified by signature and replay nonces)
 */
export const RATE_LIMITS = {
  LOGIN: {
    name: 'login',
    requests: 5,
    window: '15 m' as const,
    windowMs: 15 * 60 * 1000,
    failMode: 'closed' as const, // Fail closed if Redis unreachable in production
  },
  OTP_SEND_PHONE: {
    name: 'otp-send-phone',
    requests: 3,
    window: '10 m' as const,
    windowMs: 10 * 60 * 1000,
    failMode: 'closed' as const,
  },
  OTP_SEND_IP: {
    name: 'otp-send-ip',
    requests: 10,
    window: '1 h' as const,
    windowMs: 60 * 60 * 1000,
    failMode: 'closed' as const,
  },
  OTP_VERIFY_PHONE: {
    name: 'otp-verify-phone',
    requests: 5,
    window: '10 m' as const,
    windowMs: 10 * 60 * 1000,
    failMode: 'closed' as const,
  },
  PLACE_ORDER: {
    name: 'place-order',
    requests: 5,
    window: '1 m' as const,
    windowMs: 60 * 1000,
    failMode: 'closed' as const,
  },
  SEARCH_CATALOG: {
    name: 'search-catalog',
    requests: 60,
    window: '1 m' as const,
    windowMs: 60 * 1000,
    failMode: 'open' as const, // Fail open if Redis unreachable in production
  },
  ADMIN_RIDER_API: {
    name: 'admin-rider-api',
    requests: 120,
    window: '1 m' as const,
    windowMs: 60 * 1000,
    failMode: 'open' as const,
  },
} as const;

export type RateLimitConfig = (typeof RATE_LIMITS)[keyof typeof RATE_LIMITS];

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfterSeconds?: number;
}

// In-memory sliding-window fallback for local development or when Redis env vars are absent
interface MemoryRecord {
  timestamps: number[];
}
const memoryStorage = new Map<string, MemoryRecord>();

// Cleanup stale memory records periodically (every 5 minutes)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    memoryStorage.forEach((record, key) => {
      record.timestamps = record.timestamps.filter((t) => now - t < 3600 * 1000);
      if (record.timestamps.length === 0) {
        memoryStorage.delete(key);
      }
    });
  }, 5 * 60 * 1000).unref?.();
}

export function checkInMemory(identifier: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const windowStart = now - windowMs;

  let record = memoryStorage.get(identifier);
  if (!record) {
    record = { timestamps: [] };
    memoryStorage.set(identifier, record);
  }

  // Filter timestamps within current sliding window
  record.timestamps = record.timestamps.filter((t) => t > windowStart);

  if (record.timestamps.length >= limit) {
    const oldestInWindow = record.timestamps[0];
    const resetTime = oldestInWindow + windowMs;
    const retryAfter = Math.max(1, Math.ceil((resetTime - now) / 1000));
    return {
      success: false,
      limit,
      remaining: 0,
      reset: resetTime,
      retryAfterSeconds: retryAfter,
    };
  }

  record.timestamps.push(now);
  const remaining = Math.max(0, limit - record.timestamps.length);
  return {
    success: true,
    limit,
    remaining,
    reset: now + windowMs,
  };
}

export function resetInMemoryLimiter(): void {
  memoryStorage.clear();
}

// Lazy Redis / Upstash client initialization
let redisClient: Redis | null = null;
const ratelimitInstances = new Map<string, Ratelimit>();

function getUpstashRatelimit(config: RateLimitConfig): Ratelimit | null {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({ url, token });
  }

  if (!ratelimitInstances.has(config.name)) {
    const limiter = new Ratelimit({
      redis: redisClient,
      limiter: Ratelimit.slidingWindow(config.requests, config.window),
      prefix: `@sri-amman/rl:${config.name}`,
      analytics: false,
    });
    ratelimitInstances.set(config.name, limiter);
  }

  return ratelimitInstances.get(config.name) || null;
}

/**
 * Extracts the real client IP:
 * Checks x-forwarded-for first entry, falling back to x-real-ip or req.ip
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const firstIp = forwarded.split(',')[0].trim();
    if (firstIp) return firstIp;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp.trim();

  return (req as any).ip || '127.0.0.1';
}

/**
 * Checks a rate limit for a given identifier against a config.
 * - In development or when Redis env vars are missing: falls back to in-memory sliding window.
 * - In production: uses Upstash Redis. If Redis is unreachable, fails open for browse/search
 *   and fails closed for login, OTP, and orders.
 */
export async function checkRateLimit(
  config: RateLimitConfig,
  identifier: string
): Promise<RateLimitResult> {
  const isProd = process.env.NODE_ENV === 'production';
  const upstashLimiter = getUpstashRatelimit(config);

  if (!upstashLimiter) {
    // Missing Redis env vars: use in-memory sliding window
    return checkInMemory(`${config.name}:${identifier}`, config.requests, config.windowMs);
  }

  try {
    const res = await upstashLimiter.limit(identifier);
    const now = Date.now();
    const retryAfter = res.success ? undefined : Math.max(1, Math.ceil((res.reset - now) / 1000));

    return {
      success: res.success,
      limit: res.limit,
      remaining: res.remaining,
      reset: res.reset,
      retryAfterSeconds: retryAfter,
    };
  } catch (err) {
    console.error(`[RateLimit] Upstash error on ${config.name} (${identifier}):`, err);

    if (isProd && config.failMode === 'closed') {
      // Fail closed for security sensitive endpoints (login, OTP, orders)
      return {
        success: false,
        limit: config.requests,
        remaining: 0,
        reset: Date.now() + 60000,
        retryAfterSeconds: 60,
      };
    }

    // Fail open for search/browse or fallback to in-memory
    return checkInMemory(`${config.name}:${identifier}`, config.requests, config.windowMs);
  }
}

/**
 * Returns a standardized 429 Too Many Requests response with Retry-After header.
 */
export function createRateLimitResponse(
  retryAfterSeconds: number = 60,
  message: string = 'Too many requests. Please try again later.'
): NextResponse {
  return NextResponse.json(
    {
      error: message,
      retryAfter: retryAfterSeconds,
    },
    {
      status: 429,
      headers: {
        'Retry-After': String(retryAfterSeconds),
        'X-RateLimit-Reset': String(Math.floor(Date.now() / 1000) + retryAfterSeconds),
      },
    }
  );
}

/**
 * Basic bot protection:
 * - Honeypot field (must be empty; if populated, indicates a bot)
 * - Minimum time check: form submissions under 400ms are automated bots
 */
export function verifyBotProtection(options: {
  honeypot?: string | null;
  formStartTime?: number | string | null;
  minTimeMs?: number;
}): { isBot: boolean; reason?: string } {
  const { honeypot, formStartTime, minTimeMs = 400 } = options;

  // 1. Honeypot check
  if (honeypot && honeypot.trim().length > 0) {
    return { isBot: true, reason: 'Honeypot field triggered' };
  }

  // 2. Minimum form fill time check
  if (formStartTime) {
    const start = typeof formStartTime === 'number' ? formStartTime : parseInt(String(formStartTime), 10);
    if (!isNaN(start)) {
      const elapsed = Date.now() - start;
      if (elapsed > 0 && elapsed < minTimeMs) {
        return { isBot: true, reason: `Submission too rapid (${elapsed}ms < ${minTimeMs}ms)` };
      }
    }
  }

  return { isBot: false };
}
