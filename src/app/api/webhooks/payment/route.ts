import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  // 1. Signature Verification via HMAC-SHA256 & Timing Safe Equal
  const signature =
    req.headers.get('x-webhook-signature') ||
    req.headers.get('x-razorpay-signature') ||
    '';

  const webhookSecret = process.env.PAYMENT_WEBHOOK_SECRET || process.env.WEBHOOK_SECRET || '';

  if (!webhookSecret) {
    logger.warn('WEBHOOK_SECRET_MISSING', 'Webhook secret is not configured in environment variables', {}, requestId);
  }

  const rawBody = await req.text();

  if (webhookSecret) {
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
      logger.security('PAYMENT_WEBHOOK_SIGNATURE_MISMATCH', 'Invalid HMAC signature on payment webhook', {
        providedLength: signature.length,
      }, requestId);

      return new NextResponse(
        JSON.stringify({ error: 'Unauthorized: Invalid webhook signature' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'x-request-id': requestId } }
      );
    }
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

  // 3. Idempotent Deduplication via webhook_events
  try {
    const { data: existingEvent } = await supabase
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
    await supabase.from('webhook_events').insert({
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

  // 4. Update Order Status & Write to Audit Logs
  if (orderId) {
    try {
      const isPaid = status.includes('captured') || status.includes('paid') || status.includes('success');

      await supabase
        .from('orders')
        .update({
          payment_status: isPaid ? 'paid' : 'failed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      await supabase.from('audit_logs').insert({
        entity_type: 'orders',
        entity_id: orderId,
        action: 'PAYMENT_STATUS_UPDATE',
        metadata: {
          webhookEventId: eventId,
          status,
          isPaid,
          timestamp: new Date().toISOString(),
        },
      });

      logger.info('ORDER_PAYMENT_STATUS_UPDATED', `Order ${orderId} marked as ${isPaid ? 'paid' : 'failed'}`, {
        orderId,
        isPaid,
      }, requestId);
    } catch (err: unknown) {
      logger.error('ORDER_PAYMENT_UPDATE_ERROR', 'Failed to update order payment status', {
        orderId,
        error: err instanceof Error ? err.message : String(err),
      }, requestId);
    }
  }

  return NextResponse.json(
    { status: 'success', eventId },
    { status: 200, headers: { 'x-request-id': requestId } }
  );
}
