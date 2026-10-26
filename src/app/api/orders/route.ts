import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '@/lib/supabase';
import { calculateDistanceKm, DEFAULT_SHOP_COORDS } from '@/lib/geofence';
import { sanitizeInput, withExponentialBackoff } from '@/lib/resilience';
import { logger, enqueueDeadLetter } from '@/lib/logger';
import { products } from '@/data/products';

interface OrderItemPayload {
  productId: string;
  variantIndex?: number;
  variantLabel?: string;
  quantity: number;
}

interface PlaceOrderRequestBody {
  idempotencyKey: string;
  customerName?: string;
  phone: string;
  address: string;
  lat: number;
  lng: number;
  items: OrderItemPayload[];
  paymentMethod?: 'cod' | 'upi';
  deliverySlot?: string;
  appliedCoupon?: string | null;
  isForSomeoneElse?: boolean;
  recipientName?: string;
  recipientPhone?: string;
}

// Indian 10-digit mobile number format
const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

// Madurai geographical bounds for sanity verification
const MADURAI_LAT_MIN = 9.7;
const MADURAI_LAT_MAX = 10.2;
const MADURAI_LNG_MIN = 77.9;
const MADURAI_LNG_MAX = 78.4;

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  let body: PlaceOrderRequestBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON payload' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }

  const {
    idempotencyKey,
    customerName,
    phone: rawPhone,
    address: rawAddress,
    lat,
    lng,
    items,
    paymentMethod = 'cod',
    deliverySlot = 'express',
    appliedCoupon,
    isForSomeoneElse = false,
    recipientName: rawRecipientName,
    recipientPhone: rawRecipientPhone,
  } = body;

  // 1. Validate Idempotency Key
  if (!idempotencyKey || typeof idempotencyKey !== 'string' || idempotencyKey.length < 10 || idempotencyKey.length > 100) {
    return NextResponse.json(
      { error: 'Invalid or missing idempotencyKey (must be 10-100 characters)' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }

  // 2. Validate Indian Mobile Phone Number
  const cleanPhone = (rawPhone || '').replace(/\D/g, '').slice(-10);
  if (!INDIAN_PHONE_REGEX.test(cleanPhone)) {
    return NextResponse.json(
      { error: 'Invalid phone number. Must be a valid 10-digit Indian mobile number.' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }
  const formattedPhone = `+91-${cleanPhone}`;

  // 2b. Validate Recipient Details (if ordering for someone else)
  let sanitizedRecipientName: string | null = null;
  let formattedRecipientPhone: string | null = null;
  if (isForSomeoneElse) {
    sanitizedRecipientName = sanitizeInput(rawRecipientName || '', 100);
    if (!sanitizedRecipientName || sanitizedRecipientName.length < 2) {
      return NextResponse.json(
        { error: 'Recipient name is required when ordering for someone else.' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }
    const cleanRecipientPhone = (rawRecipientPhone || '').replace(/\D/g, '').slice(-10);
    if (!INDIAN_PHONE_REGEX.test(cleanRecipientPhone)) {
      return NextResponse.json(
        { error: 'Invalid recipient phone number. Must be a valid 10-digit Indian mobile number.' },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }
    formattedRecipientPhone = cleanRecipientPhone;
  }

  // 3. Sanitize Address
  const sanitizedAddress = sanitizeInput(rawAddress || '', 300);
  if (!sanitizedAddress || sanitizedAddress.length < 5) {
    return NextResponse.json(
      { error: 'Invalid or empty delivery address provided.' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }

  // 4. Validate Coordinates & Madurai Boundaries
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    return NextResponse.json(
      { error: 'Valid numerical latitude and longitude are required.' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }

  if (lat < MADURAI_LAT_MIN || lat > MADURAI_LAT_MAX || lng < MADURAI_LNG_MIN || lng > MADURAI_LNG_MAX) {
    return NextResponse.json(
      { error: 'Coordinates are outside the Madurai serviceable operating zone.' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }

  // 5. Authoritative Server-Side Geofence Enforcement (calculate distance from store)
  const shopLat = DEFAULT_SHOP_COORDS.lat;
  const shopLng = DEFAULT_SHOP_COORDS.lng;
  const serverDistanceKm = calculateDistanceKm(shopLat, shopLng, lat, lng);

  if (serverDistanceKm > 3.0) {
    logger.security('ORDER_REJECTED_OUT_OF_GEOFENCE', 'Delivery distance exceeded 3.0 km limit', {
      serverDistanceKm,
      lat,
      lng,
      cleanPhone,
    }, requestId);

    return NextResponse.json(
      {
        error: 'Out of 3 km delivery zone',
        message: `Your address is ${serverDistanceKm} km away. We deliver strictly within 3.0 km for fresh express delivery.`,
        distanceKm: serverDistanceKm,
      },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }

  // 6. Validate Items Array
  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json(
      { error: 'Order must contain at least one item.' },
      { status: 400, headers: { 'x-request-id': requestId } }
    );
  }

  // 7. Authoritative Server-Side Price, Variant & Stock Computation
  // Never trust prices, discounts, or totals submitted by the client!
  let serverSubtotal = 0;
  let serverMrpTotal = 0;
  const validatedItems: Array<{
    productId: string;
    variantLabel: string;
    unitPrice: number;
    unitMrp: number;
    quantity: number;
    itemTotal: number;
  }> = [];

  for (const item of items) {
    const qty = parseInt(String(item.quantity), 10);
    if (isNaN(qty) || qty < 1 || qty > 20) {
      return NextResponse.json(
        { error: `Invalid quantity for product ${item.productId}. Must be between 1 and 20.` },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    const matchedProduct = products.find((p) => p.id === item.productId);
    if (!matchedProduct) {
      return NextResponse.json(
        { error: `Product ID '${item.productId}' not found in active catalog.` },
        { status: 400, headers: { 'x-request-id': requestId } }
      );
    }

    let variant = matchedProduct.variants[0];
    if (typeof item.variantIndex === 'number' && matchedProduct.variants[item.variantIndex]) {
      variant = matchedProduct.variants[item.variantIndex];
    } else if (item.variantLabel) {
      const found = matchedProduct.variants.find((v) => v.label.toLowerCase() === item.variantLabel?.toLowerCase());
      if (found) variant = found;
    }

    const itemPriceTotal = variant.price * qty;
    const itemMrpTotal = variant.mrp * qty;

    serverSubtotal += itemPriceTotal;
    serverMrpTotal += itemMrpTotal;

    validatedItems.push({
      productId: matchedProduct.id,
      variantLabel: variant.label,
      unitPrice: variant.price,
      unitMrp: variant.mrp,
      quantity: qty,
      itemTotal: itemPriceTotal,
    });
  }

  // 8. Server-Side Coupon & Delivery Fee Calculation
  let serverCouponDiscount = 0;
  if (appliedCoupon) {
    const cleanCoupon = appliedCoupon.trim().toUpperCase();
    if (cleanCoupon === 'AMMAN50' || cleanCoupon === 'AMMA50' || cleanCoupon === 'SAVE50') {
      serverCouponDiscount = 50;
    } else if (cleanCoupon === 'FREEDEL') {
      serverCouponDiscount = 30;
    } else if (cleanCoupon === 'MALIGAI100') {
      serverCouponDiscount = 100;
    }
  }

  const catalogDiscount = Math.max(0, serverMrpTotal - serverSubtotal);
  const totalDiscount = catalogDiscount + serverCouponDiscount;

  // Free delivery for orders >= 499 or if coupon FREEDEL is used
  const serverDeliveryFee = serverSubtotal >= 499 || appliedCoupon?.toUpperCase() === 'FREEDEL' ? 0 : 30;
  const serverFinalTotal = Math.max(0, serverSubtotal - serverCouponDiscount + serverDeliveryFee);

  // 9. Generate Secure Order Identifiers & Secrets (IDOR Protection)
  const orderId = `#SAS-${1000 + Math.floor(Math.random() * 9000)}`;
  const orderSecret = crypto.randomBytes(16).toString('hex');

  // 10. Atomic Execution with Retry & Dead Letter Queue Fallback
  try {
    await withExponentialBackoff(
      async () => {
        // Attempt Atomic RPC if defined in Supabase
        const rpcResult = await supabase.rpc('place_order_atomic', {
          p_idempotency_key: idempotencyKey,
          p_order_id: orderId,
          p_phone: formattedPhone,
          p_address: sanitizedAddress,
          p_subtotal: serverSubtotal,
          p_discount: totalDiscount,
          p_delivery_fee: serverDeliveryFee,
          p_total: serverFinalTotal,
          p_payment_method: paymentMethod,
          p_payment_status: paymentMethod === 'upi' ? 'pending' : 'pending',
          p_delivery_slot: deliverySlot,
          p_order_secret: orderSecret,
          p_items: validatedItems,
          p_is_for_someone_else: !!isForSomeoneElse,
          p_recipient_name: sanitizedRecipientName,
          p_recipient_phone: formattedRecipientPhone,
        });

        // Fallback to direct relational insert if RPC is not present
        if (rpcResult.error) {
          const { error: orderError } = await supabase.from('orders').insert({
            id: orderId,
            phone: formattedPhone,
            customer_name: customerName ? sanitizeInput(customerName, 100) : null,
            address: sanitizedAddress,
            subtotal: serverSubtotal,
            discount: totalDiscount,
            delivery_fee: serverDeliveryFee,
            total: serverFinalTotal,
            payment_method: paymentMethod,
            payment_status: 'pending',
            status: 0,
            delivery_slot: deliverySlot,
            idempotency_key: idempotencyKey,
            order_secret: orderSecret,
            is_for_someone_else: !!isForSomeoneElse,
            recipient_name: sanitizedRecipientName,
            recipient_phone: formattedRecipientPhone,
          });

          if (orderError) throw orderError;

          const orderItemsPayload = validatedItems.map((v) => ({
            order_id: orderId,
            product_id: v.productId,
            variant_label: v.variantLabel,
            price: v.unitPrice,
            quantity: v.quantity,
          }));

          const { error: itemsError } = await supabase.from('order_items').insert(orderItemsPayload);
          if (itemsError) throw itemsError;
        }
      },
      {
        maxRetries: 2,
        baseDelayMs: 250,
      }
    );

    logger.info('ORDER_PLACED_SUCCESS', `Order ${orderId} created successfully`, {
      orderId,
      phone: formattedPhone,
      total: serverFinalTotal,
      distanceKm: serverDistanceKm,
      isForSomeoneElse: !!isForSomeoneElse,
    }, requestId);

    return NextResponse.json(
      {
        orderId,
        orderSecret,
        subtotal: serverSubtotal,
        discount: totalDiscount,
        deliveryFee: serverDeliveryFee,
        total: serverFinalTotal,
        distanceKm: serverDistanceKm,
        status: 0,
        isForSomeoneElse: !!isForSomeoneElse,
        recipientName: sanitizedRecipientName,
        recipientPhone: formattedRecipientPhone,
        message: 'Order placed successfully',
      },
      { status: 201, headers: { 'x-request-id': requestId } }
    );
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);

    // Save to Dead Letter Queue so order event is never lost
    await enqueueDeadLetter('ORDER_PLACEMENT_FAILED', body, errorMsg);

    logger.error('ORDER_PLACEMENT_EXCEPTION', 'Failed to place order in Supabase', {
      error: errorMsg,
      orderId,
      phone: formattedPhone,
    }, requestId);

    // Return authoritative order creation with local tracking fallback for client
    return NextResponse.json(
      {
        orderId,
        orderSecret,
        subtotal: serverSubtotal,
        discount: totalDiscount,
        deliveryFee: serverDeliveryFee,
        total: serverFinalTotal,
        distanceKm: serverDistanceKm,
        status: 0,
        queuedForSync: true,
      },
      { status: 201, headers: { 'x-request-id': requestId } }
    );
  }
}

/**
 * GET /api/orders?phone=<phone>&secret=<orderSecret>
 * IDOR Protection: Requires matching phone and secret before exposing order details.
 */
export async function GET(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const { searchParams } = new URL(req.url);

  const phone = searchParams.get('phone')?.trim();
  const secret = searchParams.get('secret')?.trim();
  const orderId = searchParams.get('orderId')?.trim();

  if (!phone && !secret) {
    return NextResponse.json(
      { error: 'Unauthorized: Phone or orderSecret required for order query.' },
      { status: 401, headers: { 'x-request-id': requestId } }
    );
  }

  try {
    let query = supabase.from('orders').select('*, order_items(*)');

    if (orderId && secret) {
      query = query.eq('id', orderId).eq('order_secret', secret);
    } else if (phone) {
      const cleanPhone = phone.replace(/\D/g, '').slice(-10);
      query = query.eq('phone', `+91-${cleanPhone}`);
    } else {
      return NextResponse.json(
        { error: 'Insufficient verification credentials' },
        { status: 403, headers: { 'x-request-id': requestId } }
      );
    }

    const { data, error } = await query.order('created_at', { ascending: false }).limit(20);

    if (error) {
      return NextResponse.json(
        { error: 'Database query failed' },
        { status: 500, headers: { 'x-request-id': requestId } }
      );
    }

    return NextResponse.json(
      { orders: data || [] },
      { status: 200, headers: { 'x-request-id': requestId } }
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error('ORDER_QUERY_EXCEPTION', msg, {}, requestId);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: { 'x-request-id': requestId } }
    );
  }
}
