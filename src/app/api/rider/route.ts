import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { products as fallbackCatalog } from '@/data/products';
import { parseDeliverySlot, formatDeliverySlot, applyOrderOverlay, setOrderOverlay, getOrderOverlay } from '@/lib/order-utils';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCode = (searchParams.get('code') || searchParams.get('id') || '').trim();
    const riderPhone = (searchParams.get('riderPhone') || req.headers.get('x-rider-phone') || '').trim();
    const riderName = (searchParams.get('riderName') || req.headers.get('x-rider-name') || '').trim();
    const tab = searchParams.get('tab') || 'all'; // 'ready', 'active', 'delivered', 'all'

    // If no code provided, fetch orders list scoped to rider
    if (!rawCode) {
      let query = supabase
        .from('orders')
        .select('*, order_items(*)')
        .order('created_at', { ascending: false })
        .limit(30);

      if (tab === 'ready') {
        query = query.in('status', [0, 1]);
      } else if (tab === 'active') {
        query = query.eq('status', 2);
      } else if (tab === 'delivered') {
        query = query.eq('status', 3);
      } else {
        // default all active & ready
        query = query.in('status', [0, 1, 2, 3]);
      }

      const { data: rawOrders, error: readyError } = await query;
      if (readyError) {
        throw readyError;
      }

      // Filter: If riderPhone provided, they see:
      // 1. Ready orders at counter (unassigned or assigned to them)
      // 2. Active or delivered orders specifically assigned to them
      const rawWithOverlay = (rawOrders || []).map(applyOrderOverlay);
      const filtered = rawWithOverlay.filter((o: any) => {
        const { riderPhone: parsedPhone } = parseDeliverySlot(o.delivery_slot);
        const assignedPhone = o.assigned_rider_phone || parsedPhone;
        if (!riderPhone) return true;
        if (o.status === 0 || o.status === 1) {
          return !assignedPhone || assignedPhone === riderPhone;
        }
        return assignedPhone === riderPhone;
      });

      const mappedOrders = filtered.map((o: any) => {
        const { slot, riderName: parsedName, riderPhone: parsedPhone } = parseDeliverySlot(o.delivery_slot);
        return {
          id: o.id,
          customerName: o.customer_name || 'Customer',
          phone: o.phone || '',
          address: o.address || '',
          lat: o.lat || null,
          lng: o.lng || null,
          distanceKm: typeof o.distance_km === 'number' ? o.distance_km : 1.8,
          total: Number(o.total || 0),
          paymentMethod: o.payment_method || 'cod',
          paymentStatus: o.payment_status || 'pending',
          status: typeof o.status === 'number' ? o.status : 0,
          deliverySlot: slot,
          isForSomeoneElse: Boolean(o.is_for_someone_else),
          recipientName: o.recipient_name || undefined,
          recipientPhone: o.recipient_phone || undefined,
          assignedRiderName: o.assigned_rider_name || parsedName || undefined,
          assignedRiderPhone: o.assigned_rider_phone || parsedPhone || undefined,
          createdAt: o.created_at || new Date().toISOString(),
          itemCount: Array.isArray(o.order_items) ? o.order_items.length : 1,
        };
      });

      return NextResponse.json({
        orders: mappedOrders,
      });
    }

    // Extract digits or clean code: e.g. "4821" or "#SAS-4821" -> "4821"
    const cleanDigits = rawCode.replace(/\D/g, '');
    const cleanQuery = cleanDigits.length >= 4 ? cleanDigits : rawCode.replace('#', '').trim();

    // Fetch order matching code
    const { data: matchedOrders, error } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .ilike('id', `%${cleanQuery}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    if (!matchedOrders || matchedOrders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found for code: ' + rawCode },
        { status: 404 }
      );
    }

    const orderRow = applyOrderOverlay(matchedOrders[0]);
    const { slot, riderName: parsedName, riderPhone: parsedPhone } = parseDeliverySlot(orderRow.delivery_slot);
    const assignedPhone = orderRow.assigned_rider_phone || parsedPhone;
    const assignedName = orderRow.assigned_rider_name || parsedName;

    // Authorization check: If order is active (status 2) or delivered (status 3),
    // ensure it is assigned to this rider or unassigned
    if (
      riderPhone &&
      assignedPhone &&
      assignedPhone !== riderPhone &&
      orderRow.status >= 2
    ) {
      return NextResponse.json(
        { error: 'This order is assigned to another delivery partner.' },
        { status: 403 }
      );
    }

    // Fetch catalog names for items
    const { data: catalogProducts } = await supabase
      .from('products')
      .select('id, name_en, name_ta');

    const items = Array.isArray(orderRow.order_items)
      ? orderRow.order_items.map((item: any) => {
          const match: any = (catalogProducts || []).find((p: any) => p.id === item.product_id) ||
            fallbackCatalog.find((p) => p.id === item.product_id);
          return {
            id: item.id,
            productId: item.product_id,
            nameEn: match?.name_en || match?.nameEn || item.product_id,
            nameTa: match?.name_ta || match?.nameTa || '',
            variantLabel: item.variant_label || '1 pack',
            price: Number(item.price || 0),
            quantity: Number(item.quantity || 1),
          };
        })
      : [];

    return NextResponse.json({
      order: {
        id: orderRow.id,
        customerName: orderRow.customer_name || 'Lakshmi Narayanan',
        phone: orderRow.phone || '+91 98421 00000',
        address: orderRow.address || '4th Cross Street, Anna Nagar, Madurai',
        lat: orderRow.lat || 9.9252,
        lng: orderRow.lng || 78.1198,
        distanceKm: typeof orderRow.distance_km === 'number' ? orderRow.distance_km : 1.8,
        total: Number(orderRow.total || 0),
        paymentMethod: orderRow.payment_method || 'cod',
        paymentStatus: orderRow.payment_status || 'pending',
        status: typeof orderRow.status === 'number' ? orderRow.status : 0,
        deliverySlot: slot,
        createdAt: orderRow.created_at || new Date().toISOString(),
        isForSomeoneElse: Boolean(orderRow.is_for_someone_else),
        recipientName: orderRow.recipient_name || undefined,
        recipientPhone: orderRow.recipient_phone || undefined,
        assignedRiderName: assignedName || undefined,
        assignedRiderPhone: assignedPhone || undefined,
        items,
      },
    });
  } catch (err: any) {
    logger.error('RIDER_GET_FAILED', 'Failed to fetch rider order details', { error: err.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId, status, paymentCollectedMethod, riderName, riderPhone } = body;

    if (!orderId || typeof status !== 'number') {
      return NextResponse.json({ error: 'orderId and numeric status required' }, { status: 400 });
    }

    // Step 1: Fetch existing order to validate status transition
    const { data: existing, error: fetchErr } = await supabase
      .from('orders')
      .select('id, status, delivery_slot, payment_method, payment_status')
      .eq('id', orderId)
      .single();

    if (fetchErr || !existing) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const overlay = getOrderOverlay(orderId);
    const currentStatus = typeof overlay?.status === 'number' ? overlay.status : (typeof existing.status === 'number' ? existing.status : 0);
    const currentSlot = overlay?.deliverySlot || existing.delivery_slot;
    const { riderPhone: existingRiderPhone, riderName: existingRiderName } = parseDeliverySlot(currentSlot);
    const assignedPhone = overlay?.assignedRiderPhone || existingRiderPhone;

    // Step 2: Validate status lifecycle progression
    // 0/1 (Ready) -> 2 (On Route)
    // 2 (On Route) -> 3 (Delivered)
    // 2 (On Route) -> 4 (Failed/Returned - if supported)
    if (status === 2) {
      if (currentStatus > 2) {
        return NextResponse.json(
          { error: 'Cannot transition delivered or settled order back to transit.' },
          { status: 400 }
        );
      }
    } else if (status === 3) {
      if (currentStatus < 2) {
        return NextResponse.json(
          { error: 'Order must be picked up and on route before marking delivered.' },
          { status: 400 }
        );
      }
    } else if (status < currentStatus) {
      return NextResponse.json(
        { error: 'Status regression is not permitted.' },
        { status: 400 }
      );
    }

    // Step 3: Authorization check
    if (
      riderPhone &&
      assignedPhone &&
      assignedPhone !== riderPhone
    ) {
      return NextResponse.json(
        { error: 'Unauthorized: This order is assigned to another delivery partner.' },
        { status: 403 }
      );
    }

    const updatePayload: Record<string, any> = { status };

    // When status === 2 (On route / picked up), assign to this rider
    if (status === 2) {
      updatePayload.delivery_slot = formatDeliverySlot(
        currentSlot,
        riderName || existingRiderName,
        riderPhone
      );
    }

    // When status === 3 (Delivered), set payment_status to 'paid'
    if (status === 3) {
      updatePayload.payment_status = 'paid';
    }

    setOrderOverlay(orderId, {
      status,
      ...(status === 2 ? {
        deliverySlot: updatePayload.delivery_slot,
        assignedRiderName: riderName || existingRiderName,
        assignedRiderPhone: riderPhone,
      } : {}),
      ...(status === 3 ? { paymentStatus: 'paid' } : {})
    });

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      throw error;
    }

    // Write audit log without customer PII
    try {
      await supabase.from('audit_logs').insert({
        action: status === 2 ? 'RIDER_START_RIDE' : status === 3 ? 'RIDER_DELIVERED' : 'RIDER_STATUS_UPDATE',
        details: {
          orderId,
          previousStatus: currentStatus,
          newStatus: status,
          riderPhone: riderPhone ? `+91****${riderPhone.slice(-4)}` : undefined,
          paymentCollectedMethod: paymentCollectedMethod || null,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch {}

    logger.info('RIDER_ORDER_STATUS_UPDATED', `Rider updated order ${orderId} from ${currentStatus} to ${status}`, {
      orderId,
      status,
      paymentCollectedMethod,
    });

    return NextResponse.json({
      success: true,
      orderId,
      status,
      paymentStatus: updatePayload.payment_status || existing.payment_status,
    });
  } catch (err: any) {
    logger.error('RIDER_PATCH_FAILED', 'Failed to update rider order status', { error: err.message });
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
