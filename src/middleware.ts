import { NextRequest, NextResponse } from 'next/server';
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
} from '@/lib/rateLimit';

// Maximum payload size allowed for JSON requests (100 KB)
const MAX_REQUEST_BODY_SIZE_BYTES = 100 * 1024;

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

    if (!isWebhook) {
      if (pathname.startsWith('/api/catalog')) {
        // Search & catalog: 60 per minute per IP
        const rl = await checkRateLimit(RATE_LIMITS.SEARCH_CATALOG, `cat:${ip}`);
        if (!rl.success) {
          return createRateLimitResponse(rl.retryAfterSeconds, 'Too many catalog requests. Please wait.');
        }
      } else if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/rider')) {
        // Admin and rider APIs: 120 per minute per user/IP
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
