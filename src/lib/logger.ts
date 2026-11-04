/**
 * Enterprise Structured Logging, Alerting & Dead Letter Queue (DLQ)
 * Sri Amman Supermarket Security & Observability Architecture
 * Note: ZERO EMOJIS in all logs and payloads.
 * Features automatic PII and secret redaction (phones, API keys, passwords, tokens).
 */

import { supabase } from './supabase';
import { fetchWithTimeout } from './resilience';

export type LogLevel = 'info' | 'warn' | 'error' | 'security';

export interface StructuredLogPayload {
  level: LogLevel;
  event: string;
  requestId?: string;
  message: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// Regex patterns to detect and redact sensitive values
const SENSITIVE_KEY_REGEX = /(?:password|secret|token|api_?key|service_?role|authorization|cookie|session|credentials|bearer)/i;
const PHONE_NUMBER_REGEX = /(?:\+?91[\s-]?)?[6-9]\d{4}[\s-]?\d{5}/g;
const SECRET_TOKEN_REGEX = /(?:bearer\s+[a-zA-Z0-9_\-\.]+)|(?:ey[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]{10,}\.[a-zA-Z0-9_\-]+)/gi;

/**
 * Sanitizes phone numbers by keeping only the last 4 digits (e.g., "+91******3210")
 */
export function maskPhoneNumber(phone: string): string {
  if (!phone || typeof phone !== 'string') return phone;
  const digits = phone.replace(/\D/g, '');
  if (digits.length >= 10) {
    const last4 = digits.slice(-4);
    return `+91******${last4}`;
  }
  return '[REDACTED_PHONE]';
}

/**
 * Recursively sanitizes any object, string, or array to strip passwords,
 * auth tokens, secret keys, and phone numbers before logging.
 */
export function sanitizeLogData<T>(data: T, keyName?: string): T {
  if (data === null || data === undefined) return data;

  if (typeof data === 'string') {
    // If the key specifically indicated a sensitive credential
    if (keyName && SENSITIVE_KEY_REGEX.test(keyName)) {
      return '[REDACTED_SECRET]' as unknown as T;
    }
    // If the key indicated a phone number
    if (keyName && /(?:phone|mobile|recipientPhone)/i.test(keyName)) {
      return maskPhoneNumber(data) as unknown as T;
    }

    // Redact potential inline tokens or phones inside strings
    let sanitized = data.replace(SECRET_TOKEN_REGEX, '[REDACTED_TOKEN]');
    sanitized = sanitized.replace(PHONE_NUMBER_REGEX, (match) => maskPhoneNumber(match));
    return sanitized as unknown as T;
  }

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeLogData(item, keyName)) as unknown as T;
  }

  if (typeof data === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEY_REGEX.test(k)) {
        result[k] = '[REDACTED_SECRET]';
      } else if (/(?:phone|mobile|recipientPhone)/i.test(k) && typeof v === 'string') {
        result[k] = maskPhoneNumber(v);
      } else {
        result[k] = sanitizeLogData(v, k);
      }
    }
    return result as unknown as T;
  }

  return data;
}

function outputLog(payload: StructuredLogPayload) {
  const sanitizedPayload: StructuredLogPayload = {
    ...payload,
    message: sanitizeLogData(payload.message),
    metadata: payload.metadata ? (sanitizeLogData(payload.metadata) as Record<string, unknown>) : undefined,
  };

  const jsonString = JSON.stringify(sanitizedPayload);
  switch (sanitizedPayload.level) {
    case 'error':
    case 'security':
      console.error(jsonString);
      break;
    case 'warn':
      console.warn(jsonString);
      break;
    case 'info':
    default:
      console.log(jsonString);
      break;
  }
}

export const logger = {
  info(event: string, message: string, metadata?: Record<string, unknown>, requestId?: string) {
    outputLog({
      level: 'info',
      event,
      requestId,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },

  warn(event: string, message: string, metadata?: Record<string, unknown>, requestId?: string) {
    outputLog({
      level: 'warn',
      event,
      requestId,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },

  error(event: string, message: string, metadata?: Record<string, unknown>, requestId?: string) {
    outputLog({
      level: 'error',
      event,
      requestId,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },

  security(event: string, message: string, metadata?: Record<string, unknown>, requestId?: string) {
    outputLog({
      level: 'security',
      event,
      requestId,
      message,
      metadata,
      timestamp: new Date().toISOString(),
    });
  },
};

/**
 * Enqueues failed background jobs, webhook processing errors, or sync drops into the DLQ.
 * Writes to Supabase dead_letter_queue table with fallback to structured error log.
 */
export async function enqueueDeadLetter(
  jobType: string,
  payload: unknown,
  errorMessage: string
): Promise<void> {
  const timestamp = new Date().toISOString();
  const sanitizedPayload = sanitizeLogData(payload);

  logger.error('DEAD_LETTER_QUEUE_ENTRY', `Dead letter recorded for job type: ${jobType}`, {
    jobType,
    errorMessage,
    timestamp,
  });

  try {
    const { error } = await supabase.from('dead_letter_queue').insert({
      job_type: jobType,
      payload: sanitizedPayload,
      error_message: errorMessage,
      created_at: timestamp,
      status: 'pending',
    });

    if (error) {
      logger.warn('DLQ_DATABASE_INSERT_WARNING', 'Could not insert to dead_letter_queue table', {
        dbError: error.message,
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('DLQ_INSERT_EXCEPTION', 'Exception inserting dead letter entry', {
      exceptionMessage: message,
    });
  }
}

/**
 * Triggers non-blocking alert notification if ALERT_WEBHOOK_URL is configured.
 */
export async function triggerCriticalAlert(
  title: string,
  details: Record<string, unknown>
): Promise<void> {
  logger.security('CRITICAL_ALERT', title, details);

  const webhookUrl = process.env.ALERT_WEBHOOK_URL;
  if (!webhookUrl) return;

  try {
    await fetchWithTimeout(
      webhookUrl,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          details: sanitizeLogData(details),
          timestamp: new Date().toISOString(),
          environment: process.env.NODE_ENV || 'production',
        }),
      },
      3000
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    logger.warn('ALERT_WEBHOOK_FAILED', 'Failed to dispatch alert webhook notification', {
      error: message,
    });
  }
}

/**
 * Central Error Handler for API routes:
 * Formats errors into standard JSON responses and logs with full structured context.
 */
export function handleApiError(
  error: unknown,
  event: string,
  requestId: string,
  defaultMessage = 'Internal Server Error',
  statusCode = 500
) {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error(event, message, { stack, defaultMessage }, requestId);

  return {
    error: defaultMessage,
    status: statusCode,
    requestId,
  };
}
