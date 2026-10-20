/**
 * Enterprise Structured Logging, Alerting & Dead Letter Queue (DLQ)
 * Sri Amman Supermarket Security & Observability Architecture
 * Note: ZERO EMOJIS in all logs and payloads.
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

function outputLog(payload: StructuredLogPayload) {
  const jsonString = JSON.stringify(payload);
  switch (payload.level) {
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

  logger.error('DEAD_LETTER_QUEUE_ENTRY', `Dead letter recorded for job type: ${jobType}`, {
    jobType,
    errorMessage,
    timestamp,
  });

  try {
    const { error } = await supabase.from('dead_letter_queue').insert({
      job_type: jobType,
      payload,
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
          details,
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
