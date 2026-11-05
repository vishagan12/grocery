/**
 * PII Sanitizer for Sentry Monitoring
 * Ensures customer names, emails, mobile phone numbers, and secrets/tokens are
 * strictly masked before any event is dispatched to Sentry.
 */

export function sanitizeString(text: string): string {
  if (!text || typeof text !== 'string') return text;

  // 1. Scrub JWT tokens & Bearer auth headers
  let sanitized = text.replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]');
  sanitized = sanitized.replace(/eyJ[A-Za-z0-9\-_]+\.eyJ[A-Za-z0-9\-_]+\.[A-Za-z0-9\-_]+/g, '[REDACTED_JWT]');

  // 2. Scrub Indian mobile phone numbers (+91 XXXXX XXXXX, 9876543210, etc.)
  sanitized = sanitized.replace(/(?:\+91[\s\-]?)?[6-9]\d{4}[\s\-]?\d{5}/g, '+91 XXXXX XXXXX');

  // 3. Scrub emails
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]');

  return sanitized;
}

export function sanitizeObject<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') {
    if (typeof obj === 'string') return sanitizeString(obj) as unknown as T;
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject) as unknown as T;
  }

  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase();
    if (
      lowerKey.includes('password') ||
      lowerKey.includes('token') ||
      lowerKey.includes('secret') ||
      lowerKey.includes('authorization') ||
      lowerKey.includes('apikey') ||
      lowerKey.includes('service_role')
    ) {
      result[key] = '[REDACTED_SECRET]';
    } else if (lowerKey.includes('phone') || lowerKey.includes('mobile')) {
      result[key] = '+91 XXXXX XXXXX';
    } else if (lowerKey.includes('email')) {
      result[key] = '[REDACTED_EMAIL]';
    } else if (lowerKey.includes('username') || lowerKey === 'customer_name' || lowerKey === 'name') {
      result[key] = '[REDACTED_NAME]';
    } else if (typeof value === 'string') {
      result[key] = sanitizeString(value);
    } else if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeObject(value);
    } else {
      result[key] = value;
    }
  }
  return result as T;
}

export function scrubSentryEvent(event: any): any {
  if (!event) return event;

  // Mask User PII
  if (event.user) {
    if (event.user.ip_address) event.user.ip_address = undefined;
    if (event.user.email) event.user.email = '[REDACTED_EMAIL]';
    if (event.user.username) event.user.username = '[REDACTED_NAME]';
    if (event.user.name) event.user.name = '[REDACTED_NAME]';
  }

  // Mask exception message & values
  if (event.exception?.values) {
    for (const val of event.exception.values) {
      if (val.value) val.value = sanitizeString(val.value);
    }
  }

  // Mask breadcrumbs
  if (Array.isArray(event.breadcrumbs)) {
    event.breadcrumbs = event.breadcrumbs.map((b: any) => {
      if (b.message) b.message = sanitizeString(b.message);
      if (b.data) b.data = sanitizeObject(b.data);
      return b;
    });
  }

  // Mask extra & context metadata
  if (event.extra) event.extra = sanitizeObject(event.extra);
  if (event.contexts) event.contexts = sanitizeObject(event.contexts);
  if (event.request) {
    if (event.request.cookies) event.request.cookies = '[REDACTED_COOKIES]';
    if (event.request.headers) event.request.headers = sanitizeObject(event.request.headers);
    if (event.request.data) event.request.data = sanitizeObject(event.request.data);
  }

  return event;
}

