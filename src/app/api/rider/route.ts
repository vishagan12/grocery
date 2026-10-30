import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { products as fallbackCatalog } from '@/data/products';
import { parseDeliverySlot, applyOrderOverlay } from '@/lib/order-utils';
import { requireRider } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // 1. Verify caller has authenticated rider role and active profile
  const auth = await requireRider(req);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { supabase: sessionDb, riderProfile } = auth;

  try {
    const { searchParams } = new URL(req.url);
    const rawCode = (searchParams.get('code') || searchParams.get('id') || '').trim();
    const tab = searchParams.get('tab') || 'all'; // 'ready', 'active', 'delivered', 'all'

    // If no code provided, fetch orders list strictly assigned to this rider
    if (!rawCode) {
      let query = sessionDb
        .from('orders')
        .select('*, order_items(*)')
        .eq('assigned_rider_id', riderProfile.id)
        .order('created_at', { ascending: false })
        .limit(30);

      if (tab === 'ready') {
        query = query.in('status', [0, 1]);
      } else if (tab === 'active') {
        query = query.eq('status', 2);
      } else if (tab === 'delivered') {
        query = query.eq('status', 3);
      } else {
        query = query.in('status', [0, 1, 2, 3]);
      }

      const { data: rawOrders, error: readyError } = await query;
      if (readyError) {
        throw readyError;
      }

      const rawWithOverlay = (rawOrders || []).map(applyOrderOverlay);

      const mappedOrders = rawWithOverlay.map((o: any) => {
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
          assignedRiderId: o.assigned_rider_id,
          assignedRiderName: o.assigned_rider_name || parsedName || riderProfile.full_name,
          assignedRiderPhone: o.assigned_rider_phone || parsedPhone || riderProfile.phone,
          createdAt: o.created_at || new Date().toISOString(),
          itemCount: Array.isArray(o.order_items) ? o.order_items.length : 1,
        };
      });

      return NextResponse.json({
        orders: mappedOrders,
        rider: {
          id: riderProfile.id,
          name: riderProfile.full_name,
          username: riderProfile.username,
          phone: riderProfile.phone,
          vehicle: riderProfile.vehicle_info || 'Hero Splendor',
        },
      });
    }

    // Specific order lookup by code
    const cleanDigits = rawCode.replace(/\D/g, '');
    const cleanQuery = cleanDigits.length >= 4 ? cleanDigits : rawCode.replace('#', '').trim();

    // Fetch order matching code strictly assigned to this rider
    const { data: matchedOrders, error } = await sessionDb
      .from('orders')
      .select('*, order_items(*)')
      .eq('assigned_rider_id', riderProfile.id)
      .ilike('id', `%${cleanQuery}%`)
      .order('created_at', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    if (!matchedOrders || matchedOrders.length === 0) {
      return NextResponse.json(
        { error: 'Order not found or not assigned to your route' },
        { status: 404 }
      );
    }

    const orderRow = applyOrderOverlay(matchedOrders[0]);
    const { slot } = parseDeliverySlot(orderRow.delivery_slot);

    // Fetch catalog names for items
    const { data: catalogProducts } = await sessionDb
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
        customerName: orderRow.customer_name || 'Valued Customer',
        phone: orderRow.phone || '',
        address: orderRow.address || '',
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
        assignedRiderName: riderProfile.full_name,
        assignedRiderPhone: riderProfile.phone,
        items,
      },
    });
  } catch (err: any) {
    logger.error('RIDER_GET_FAILED', 'Failed to fetch rider order details', { error: err.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // 1. Verify caller has authenticated rider role and active profile
  const auth = await requireRider(req);
  if (auth instanceof NextResponse) {
    return auth;
  }

  const { supabase: sessionDb, riderProfile } = auth;

  try {
    const body = await req.json();
    const { action, orderId, status, paymentStatus, paymentCollectedMethod, newPassword } = body;

    // Self-service password change for rider
    if (action === 'CHANGE_PASSWORD') {
      if (!newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
      }

      const { error: pwErr } = await sessionDb.auth.updateUser({
        password: newPassword,
      });

      if (pwErr) {
        return NextResponse.json({ error: pwErr.message }, { status: 400 });
      }

      logger.info('RIDER_PASSWORD_CHANGED', `Rider ${riderProfile.username} updated password`);
      return NextResponse.json({ success: true, message: 'Password updated successfully' });
    }

    if (!orderId || typeof status !== 'number') {
      return NextResponse.json({ error: 'orderId and numeric status required' }, { status: 400 });
    }

    // Call public.rider_update_order_status RPC with rider's authenticated session
    // The RPC strictly validates assignment to current auth user and enforces valid transitions (0/1 -> 2, 2 -> 3)
    const { data: rpcResult, error: rpcError } = await sessionDb.rpc('rider_update_order_status', {
      p_order_id: orderId,
      p_new_status: status,
      p_payment_status: paymentStatus || (status === 3 ? 'paid' : null),
    });

    if (rpcError) {
      logger.error('RIDER_RPC_UPDATE_FAILED', rpcError.message, { orderId, status });
      return NextResponse.json({ error: rpcError.message || 'Failed to update order status' }, { status: 400 });
    }

    // Audit log without customer PII
    try {
      await sessionDb.from('audit_logs').insert({
        action: status === 2 ? 'RIDER_START_RIDE' : status === 3 ? 'RIDER_DELIVERED' : 'RIDER_STATUS_UPDATE',
        details: {
          orderId,
          newStatus: status,
          riderId: riderProfile.id,
          paymentCollectedMethod: paymentCollectedMethod || null,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch {}

    logger.info('RIDER_ORDER_STATUS_UPDATED', `Rider ${riderProfile.username} updated order ${orderId} to ${status}`, {
      orderId,
      status,
    });

    return NextResponse.json({
      success: true,
      orderId,
      status,
      paymentStatus: rpcResult?.payment_status || (status === 3 ? 'paid' : 'pending'),
    });
  } catch (err: any) {
    logger.error('RIDER_PATCH_FAILED', 'Failed to update rider order status', { error: err.message });
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}
