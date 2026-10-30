import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createServerAdminClient } from '@/lib/serverAuth';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  // Rule 6: Webhook Fail Closed
  // If PAYMENT_WEBHOOK_SECRET is missing or empty, reject every request immediately.
  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET;
  if (!webhookSecret || webhookSecret.trim() === '') {
    logger.security(
      'PAYMENT_WEBHOOK_SECRET_MISSING',
      'Payment webhook secret is unconfigured. Failing closed.',
      {},
      requestId
    );
    return new NextResponse(
      JSON.stringify({ error: 'Webhook processing disabled: Secret unconfigured' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } }
    );
  }

  // 1. Signature Verification via HMAC-SHA256 & constant-time comparison
  const signature =
    req.headers.get('x-webhook-signature') ||
    req.headers.get('x-razorpay-signature') ||
    '';

  if (!signature) {
    logger.security('PAYMENT_WEBHOOK_MISSING_SIGNATURE', 'Missing webhook signature header', {}, requestId);
    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized: Missing webhook signature' }),
      { status: 401, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } }
    );
  }

  const rawBody = await req.text();

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  const signatureBuffer = Buffer.from(signature, 'utf8');
  const expectedBuffer = Buffer.from(expectedSignature, 'utf8');

  if (
    signatureBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)
  ) {
    logger.security(
      'PAYMENT_WEBHOOK_SIGNATURE_MISMATCH',
      'Invalid HMAC signature on payment webhook',
      { providedLength: signature.length },
      requestId
    );

    return new NextResponse(
      JSON.stringify({ error: 'Unauthorized: Invalid webhook signature' }),
      { status: 401, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } }
    );
  }

  // 2. Parse Body & Validate Structure
  let payload: Record<string, any>;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid JSON payload' }),
      { status: 400, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } }
    );
  }

  const eventId =
    payload.event_id ||
    payload.id ||
    payload.payment_id ||
    req.headers.get('x-webhook-id') ||
    crypto.createHash('sha256').update(rawBody).digest('hex');

  const orderId = payload.order_id || payload.orderId || payload.payload?.payment?.entity?.notes?.order_id;
  const status = payload.status || payload.event || 'payment.captured';

  // 3. Idempotent Deduplication via webhook_events using Server Admin Client (RLS bypass for webhooks)
  try {
    const adminClient = createServerAdminClient();

    const { data: existingEvent } = await adminClient
      .from('webhook_events')
      .select('id, status')
      .eq('event_id', eventId)
      .maybeSingle();

    if (existingEvent) {
      logger.info('WEBHOOK_ALREADY_PROCESSED', `Duplicate webhook event skipped: ${eventId}`, {
        eventId,
        orderId,
      }, requestId);

      return NextResponse.json(
        { status: 'already_processed', eventId },
        { status: 200, headers: { 'x-request-id': requestId } }
      );
    }

    // Insert to webhook_events for replay shielding
    await adminClient.from('webhook_events').insert({
      event_id: eventId,
      event_type: status,
      payload,
      processed_at: new Date().toISOString(),
      status: 'processed',
    });
  } catch (err: unknown) {
    logger.warn('WEBHOOK_DEDUPLICATION_TABLE_NOTICE', 'Could not record webhook event in DB table', {
      error: err instanceof Error ? err.message : String(err),
    }, requestId);
  }

  // 4. Return provider-neutral acknowledgment
  logger.info('PAYMENT_WEBHOOK_VERIFIED', `Payment webhook event verified: ${eventId}`, {
    eventId,
    orderId,
    status,
  }, requestId);

  return NextResponse.json(
    { received: true, eventId, status },
    { status: 200, headers: { 'x-request-id': requestId } }
  );
}
