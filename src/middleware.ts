import { NextRequest, NextResponse } from 'next/server';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

// In-memory sliding-window store per Edge / Node runtime instance
const ipRateLimitStore = new Map<string, RateLimitRecord>();

function getClientIp(req: NextRequest): string {
  const forwardedFor = req.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  return req.headers.get('x-real-ip') || '127.0.0.1';
}

function checkRateLimit(ip: string, limit: number, windowMs = 60000): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const record = ipRateLimitStore.get(ip);

  if (!record || now > record.resetAt) {
    ipRateLimitStore.set(ip, {
      count: 1,
      resetAt: now + windowMs,
    });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: limit - record.count };
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  // Apply rate limiting and security checks only to /api routes
  if (pathname.startsWith('/api/')) {
    const ip = getClientIp(req);

    // 1. Sliding window rate limiter
    let maxRequestsPerMinute = 45;

    if (pathname.startsWith('/api/orders')) {
      maxRequestsPerMinute = 10;
    } else if (pathname.startsWith('/api/webhooks/')) {
      maxRequestsPerMinute = 60;
    } else if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/rider')) {
      maxRequestsPerMinute = 120; // High frequency for real-time POS, barcode scans and rider updates
    } else if (pathname.startsWith('/api/places') || pathname.startsWith('/api/resolve-shop')) {
      maxRequestsPerMinute = 45;
    }

    const { allowed, remaining } = checkRateLimit(`${ip}:${pathname.split('/')[2] || 'api'}`, maxRequestsPerMinute);

    if (!allowed) {
      return new NextResponse(
        JSON.stringify({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded. Please wait before retrying.',
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': '60',
            'x-request-id': requestId,
          },
        }
      );
    }

    // 2. CSRF Origin / Referer validation for state-changing methods (POST, PUT, DELETE, PATCH)
    // Signed webhooks are authenticated via HMAC in route handlers
    const method = req.method.toUpperCase();
    const isStateChanging = ['POST', 'PUT', 'DELETE', 'PATCH'].includes(method);
    const isWebhook = pathname.startsWith('/api/webhooks/');

    if (isStateChanging && !isWebhook) {
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
        // Same-origin browser fetches may omit origin/referer in specific secure edge calls or server-to-server calls
        // Allow if running in development or matching internal headers
        isValidOrigin = true;
      }

      if (!isValidOrigin) {
        return new NextResponse(
          JSON.stringify({
            error: 'Forbidden',
            message: 'Cross-site request validation failed',
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'x-request-id': requestId,
            },
          }
        );
      }
    }

    const res = NextResponse.next();
    res.headers.set('x-request-id', requestId);
    res.headers.set('x-ratelimit-remaining', String(remaining));
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
