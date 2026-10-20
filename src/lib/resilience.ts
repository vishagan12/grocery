/**
 * Network Resilience, Timeouts, Exponential Backoff, Input Sanitization & SSRF Protection
 * Sri Amman Supermarket Enterprise Hardening Module
 */

export interface BackoffOptions {
  maxRetries?: number;
  baseDelayMs?: number;
  shouldRetry?: (err: unknown) => boolean;
}

/**
 * 1. fetchWithTimeout: Protects external and internal API calls with an AbortController deadline.
 */
export async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeoutMs = 4500
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options.signal ? options.signal : controller.signal,
    });
    return response;
  } catch (err: unknown) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error(`Request to ${url} timed out after ${timeoutMs}ms`);
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * 2. withExponentialBackoff: Retries idempotent operations or transient failures with jitter.
 */
export async function withExponentialBackoff<T>(
  fn: () => Promise<T>,
  options: BackoffOptions = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const baseDelayMs = options.baseDelayMs ?? 300;

  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err;

      if (attempt === maxRetries) {
        break;
      }

      if (options.shouldRetry && !options.shouldRetry(err)) {
        throw err;
      }

      // Add exponential backoff delay with random jitter (0 - 100ms)
      const jitter = Math.random() * 100;
      const delay = baseDelayMs * Math.pow(2, attempt) + jitter;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/**
 * 3. sanitizeInput: Removes HTML tags, scripts, iframes, inline event handlers, and control characters.
 */
export function sanitizeInput(input: string, maxLength = 250): string {
  if (typeof input !== 'string') return '';

  let sanitized = input
    // Remove null bytes and control chars
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    // Strip script and iframe tags
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Strip common dangerous pseudo-protocols like javascript: or vbscript:
    .replace(/javascript:/gi, '')
    .replace(/vbscript:/gi, '')
    .replace(/data:text\/html/gi, '')
    // Strip HTML tags entirely
    .replace(/<[^>]*>/g, '')
    // Strip inline event attributes like onerror=, onclick=
    .replace(/\bon\w+\s*=/gi, '')
    .trim();

  if (sanitized.length > maxLength) {
    sanitized = sanitized.slice(0, maxLength).trim();
  }

  return sanitized;
}

const DEFAULT_ALLOWED_HOSTS = [
  'maps.app.goo.gl',
  'www.google.com',
  'google.com',
  'maps.googleapis.com',
  'nominatim.openstreetmap.org',
  'photon.komoot.io',
];

/**
 * 4. validateSafeExternalUrl: Blocks SSRF by enforcing HTTPS, validating host allowlist,
 * and prohibiting loopback, local, link-local, and private RFC-1918 IPv4/IPv6 ranges.
 */
export function validateSafeExternalUrl(
  rawUrl: string,
  allowedHosts: string[] = DEFAULT_ALLOWED_HOSTS
): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;

  try {
    const parsed = new URL(rawUrl);

    // Enforce HTTPS
    if (parsed.protocol !== 'https:') {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Check against loopback and local names
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname.endsWith('.local') ||
      hostname === '127.0.0.1' ||
      hostname === '0.0.0.0' ||
      hostname === '::1'
    ) {
      return false;
    }

    // Check against AWS/Cloud metadata IPs
    if (hostname === '169.254.169.254' || hostname.startsWith('169.254.')) {
      return false;
    }

    // Check IPv4 private ranges: 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16
    const ipv4Match = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipv4Match) {
      const b0 = parseInt(ipv4Match[1], 10);
      const b1 = parseInt(ipv4Match[2], 10);

      // 10.0.0.0/8
      if (b0 === 10) return false;
      // 172.16.0.0/12
      if (b0 === 172 && b1 >= 16 && b1 <= 31) return false;
      // 192.168.0.0/16
      if (b0 === 192 && b1 === 168) return false;
      // 127.0.0.0/8
      if (b0 === 127) return false;
    }

    // Match against allowed host list (exact or subdomain match)
    const isAllowed = allowedHosts.some((allowed) => {
      const lowerAllowed = allowed.toLowerCase();
      return hostname === lowerAllowed || hostname.endsWith(`.${lowerAllowed}`);
    });

    return isAllowed;
  } catch {
    return false;
  }
}
