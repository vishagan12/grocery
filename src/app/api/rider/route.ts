import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { products as fallbackCatalog } from '@/data/products';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawCode = (searchParams.get('code') || searchParams.get('id') || '').trim();

    // If no code provided, fetch active pickup-ready orders (status 0 or 1)
    if (!rawCode) {
      const { data: readyOrders, error: readyError } = await supabase
        .from('orders')
        .select('*, order_items(*)')
        .in('status', [0, 1, 2])
        .order('created_at', { ascending: false })
        .limit(10);

      const mappedReady = (readyOrders || []).map((o: any) => ({
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
      }));

      return NextResponse.json({
        orders: mappedReady,
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

    const orderRow = matchedOrders[0];

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
        createdAt: orderRow.created_at || new Date().toISOString(),
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
    const { orderId, status, paymentCollectedMethod } = body;

    if (!orderId || typeof status !== 'number') {
      return NextResponse.json({ error: 'orderId and numeric status required' }, { status: 400 });
    }

    const updatePayload: Record<string, any> = { status };

    // When status === 3 (Delivered), set payment_status to 'paid'
    if (status === 3) {
      updatePayload.payment_status = 'paid';
    }

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId);

    if (error) {
      throw error;
    }

    // Write audit log
    try {
      await supabase.from('audit_logs').insert({
        action: status === 2 ? 'RIDER_START_RIDE' : 'RIDER_DELIVERED',
        details: {
          orderId,
          status,
          paymentCollectedMethod: paymentCollectedMethod || null,
          timestamp: new Date().toISOString(),
        },
        timestamp: new Date().toISOString(),
      });
    } catch {}

    logger.info('RIDER_ORDER_STATUS_UPDATED', `Rider updated order ${orderId} to status ${status}`, {
      orderId,
      status,
      paymentCollectedMethod,
    });

    return NextResponse.json({
      success: true,
      orderId,
      status,
      paymentStatus: updatePayload.payment_status || 'unchanged',
    });
  } catch (err: any) {
    logger.error('RIDER_PATCH_FAILED', 'Failed to update rider order status', { error: err.message });
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}
