import * as Sentry from '@sentry/nextjs';
import { scrubSentryEvent } from '@/lib/sentrySanitizer';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Adjust sample rate for free tier quota (10% of transactions in production)
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    debug: false,
    environment: process.env.NEXT_PUBLIC_ENVIRONMENT || process.env.NODE_ENV || 'production',
    // Scrub PII before any event leaves the client
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });
}

