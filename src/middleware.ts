import { NextRequest, NextResponse } from 'next/server';
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
} from '@/lib/rateLimit';

// Maximum payload size allowed for JSON requests (100 KB)
const MAX_REQUEST_BODY_SIZE_BYTES = 100 * 1024;

/**
 * Constant-time comparison for load test bypass secret.
 * Compatible with Edge Runtime (using XOR bit accumulation without Node.js crypto module).
 * Requires LOADTEST_BYPASS_SECRET to be configured in environment.
 * If unset or empty, bypass is completely disabled.
 */
function isLoadTestBypassAuthorized(providedHeader: string | null): boolean {
  const secret = process.env.LOADTEST_BYPASS_SECRET;
  if (!secret || typeof secret !== 'string' || secret.trim().length === 0) {
    return false;
  }
  if (!providedHeader || typeof providedHeader !== 'string') {
    return false;
  }

  if (secret.length !== providedHeader.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < secret.length; i++) {
    result |= secret.charCodeAt(i) ^ providedHeader.charCodeAt(i);
  }

  return result === 0;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  // Protect /api/* routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(req);
    const method = req.method.toUpperCase();

    // 1. Request body size check on state-changing methods with JSON payloads
    if (['POST', 'PUT', 'PATCH'].includes(method)) {
      const contentLengthHeader = req.headers.get('content-length');
      if (contentLengthHeader) {
        const contentLength = parseInt(contentLengthHeader, 10);
        if (!isNaN(contentLength) && contentLength > MAX_REQUEST_BODY_SIZE_BYTES) {
          return NextResponse.json(
            {
              error: 'Payload Too Large',
              message: `Request body exceeds the maximum permitted size of ${MAX_REQUEST_BODY_SIZE_BYTES / 1024} KB`,
            },
            {
              status: 413,
              headers: {
                'x-request-id': requestId,
              },
            }
          );
        }
      }
    }

    // 2. Route-specific Rate Limiting via sliding window helper
    // Payment Webhooks: no per-IP rate limit (verified via HMAC signature and replay nonces)
    const isWebhook = pathname.startsWith('/api/webhooks/');

    // Check for authorized load test bypass
    const hasValidBypass = isLoadTestBypassAuthorized(req.headers.get('x-loadtest-bypass'));

    // Bypass is strictly restricted: ONLY permitted on read-only endpoints (/api/catalog, /api/resolve-shop, /api/health).
    // NEVER allowed on /api/auth, /api/orders, /api/admin, /api/rider, /api/webhooks, etc.
    const isAllowedBypassRoute =
      pathname.startsWith('/api/catalog') ||
      pathname.startsWith('/api/resolve-shop') ||
      pathname.startsWith('/api/health');

    const canBypassRateLimit = hasValidBypass && isAllowedBypassRoute;

    if (!isWebhook) {
      if (pathname.startsWith('/api/catalog')) {
        // Search & catalog: 60 per minute per IP
        if (!canBypassRateLimit) {
          const rl = await checkRateLimit(RATE_LIMITS.SEARCH_CATALOG, `cat:${ip}`);
          if (!rl.success) {
            return createRateLimitResponse(rl.retryAfterSeconds, 'Too many catalog requests. Please wait.');
          }
        }
      } else if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/rider')) {
        // Admin and rider APIs: 120 per minute per user/IP (Bypass NEVER applies here)
        const authCookie = req.cookies.get('sb-access-token')?.value || req.headers.get('authorization') || ip;
        const rl = await checkRateLimit(RATE_LIMITS.ADMIN_RIDER_API, `ops:${authCookie}`);
        if (!rl.success) {
          return createRateLimitResponse(rl.retryAfterSeconds, 'Too many operational API requests. Please wait.');
        }
      }
    }

    // 3. CSRF origin check on state-changing operations (excluding webhooks)
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && !isWebhook) {
      const origin = req.headers.get('origin');
      const referer = req.headers.get('referer');
      const host = req.headers.get('host');

      let isValidOrigin = false;
      if (origin) {
        try {
          const originHost = new URL(origin).host;
          isValidOrigin = originHost === host;
        } catch {
          isValidOrigin = false;
        }
      } else if (referer) {
        try {
          const refererHost = new URL(referer).host;
          isValidOrigin = refererHost === host;
        } catch {
          isValidOrigin = false;
        }
      } else {
        // Same-origin browser fetches or safe test clients
        isValidOrigin = true;
      }

      if (!isValidOrigin) {
        return NextResponse.json(
          {
            error: 'Forbidden',
            message: 'Cross-site request validation failed',
          },
          {
            status: 403,
            headers: {
              'x-request-id': requestId,
            },
          }
        );
      }
    }

    const res = NextResponse.next();
    res.headers.set('x-request-id', requestId);
    return res;
  }

  // Pass-through with unique x-request-id
  const res = NextResponse.next();
  res.headers.set('x-request-id', requestId);
  return res;
}

export const config = {
  matcher: ['/api/:path*'],
};
