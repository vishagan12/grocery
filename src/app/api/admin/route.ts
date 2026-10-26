import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/resilience';
import { products as fallbackCatalog } from '@/data/products';

export const dynamic = 'force-dynamic';

interface CsvRowPayload {
  itemNameOrId?: string;
  variantLabel?: string;
  price?: number;
  mrp?: number;
  stockQty?: number;
}

export async function GET(req: NextRequest) {
  try {
    // 1. Fetch recent and today's orders
    const { data: rawOrders, error: ordersError } = await supabase
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    // 2. Fetch products and their variants
    const { data: rawProducts, error: productsError } = await supabase
      .from('products')
      .select('*, product_variants(*)');

    // 3. Fetch feature flags (e.g. accepting_orders)
    const { data: rawFlags } = await supabase
      .from('feature_flags')
      .select('key, enabled');

    let isAcceptingOrders = true;
    if (rawFlags && Array.isArray(rawFlags)) {
      const flag = rawFlags.find((f: any) => f.key === 'accepting_orders');
      if (flag) isAcceptingOrders = Boolean(flag.enabled);
    }

    // Merge or fallback catalog if Supabase table is empty or loading
    let catalog = [];
    if (!productsError && rawProducts && rawProducts.length > 0) {
      catalog = rawProducts.map((p: any) => ({
        id: p.id,
        nameEn: p.name_en,
        nameTa: p.name_ta,
        categoryId: p.category_id,
        image: p.image,
        inStock: Boolean(p.in_stock),
        variants: Array.isArray(p.product_variants) && p.product_variants.length > 0
          ? p.product_variants.map((v: any) => ({
              id: v.id,
              label: v.label,
              price: Number(v.price),
              mrp: Number(v.mrp),
              stock_qty: typeof v.stock_qty === 'number' ? v.stock_qty : 20,
            }))
          : [
              {
                id: `${p.id}-v1`,
                label: 'Standard Pack',
                price: 50,
                mrp: 60,
                stock_qty: 20,
              },
            ],
      }));
    } else {
      // Use fallback catalog
      catalog = fallbackCatalog.map((p) => ({
        id: p.id,
        nameEn: p.nameEn,
        nameTa: p.nameTa,
        categoryId: p.category,
        image: p.image,
        inStock: p.inStock,
        variants: p.variants.map((v, i) => ({
          id: `${p.id}-v${i + 1}`,
          label: v.label,
          price: v.price,
          mrp: v.mrp,
          stock_qty: 15,
        })),
      }));
    }

    const orders = (rawOrders || []).map((o: any) => ({
      id: o.id,
      customerName: o.customer_name || 'Valued Customer',
      phone: o.phone || '',
      address: o.address || '',
      lat: typeof o.lat === 'number' ? o.lat : null,
      lng: typeof o.lng === 'number' ? o.lng : null,
      distanceKm: typeof o.distance_km === 'number' ? o.distance_km : 1.8,
      subtotal: Number(o.subtotal || 0),
      discount: Number(o.discount || 0),
      deliveryFee: Number(o.delivery_fee || 0),
      total: Number(o.total || 0),
      paymentMethod: o.payment_method || 'cod',
      paymentStatus: o.payment_status || 'pending',
      status: typeof o.status === 'number' ? o.status : 0,
      deliverySlot: o.delivery_slot || 'express',
      createdAt: o.created_at || new Date().toISOString(),
      isForSomeoneElse: Boolean(o.is_for_someone_else),
      recipientName: o.recipient_name || undefined,
      recipientPhone: o.recipient_phone || undefined,
      items: Array.isArray(o.order_items)
        ? o.order_items.map((item: any) => {
            const prod = catalog.find((p) => p.id === item.product_id);
            return {
              id: item.id,
              productId: item.product_id,
              productNameEn: prod?.nameEn || item.product_id,
              productNameTa: prod?.nameTa || '',
              variantLabel: item.variant_label || '1 pack',
              price: Number(item.price || 0),
              quantity: Number(item.quantity || 1),
            };
          })
        : [],
    }));

    return NextResponse.json({
      orders,
      catalog,
      acceptingOrders: isAcceptingOrders,
    });
  } catch (err: any) {
    logger.error('ADMIN_GET_FAILED', 'Failed to fetch admin dashboard data', { error: err.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (!action) {
      return NextResponse.json({ error: 'Action is required' }, { status: 400 });
    }

    // a) UPDATE_ORDER_STATUS
    if (action === 'UPDATE_ORDER_STATUS') {
      const { orderId, status, paymentStatus } = body;
      if (!orderId || typeof status !== 'number') {
        return NextResponse.json({ error: 'orderId and numeric status required' }, { status: 400 });
      }

      const updateData: Record<string, any> = { status };
      if (paymentStatus) {
        updateData.payment_status = paymentStatus;
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      try {
        await supabase.from('audit_logs').insert({
          action: 'UPDATE_ORDER_STATUS',
          details: { orderId, status, paymentStatus },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      logger.info('ADMIN_ORDER_STATUS_UPDATED', `Order ${orderId} updated to status ${status}`, { orderId, status });
      return NextResponse.json({ success: true, orderId, status });
    }

    // b) UPDATE_VARIANT_STOCK_PRICE
    if (action === 'UPDATE_VARIANT_STOCK_PRICE') {
      const { variantId, productId, price, mrp, stockQty } = body;
      if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 });
      }

      // Update variant
      const updatePayload: Record<string, any> = {};
      if (typeof price === 'number') updatePayload.price = price;
      if (typeof mrp === 'number') updatePayload.mrp = mrp;
      if (typeof stockQty === 'number') updatePayload.stock_qty = stockQty;

      if (variantId) {
        await supabase
          .from('product_variants')
          .update(updatePayload)
          .eq('id', variantId);
      }

      // Enforce the < 5 stock buffer rule across all variants of this product
      const { data: variants } = await supabase
        .from('product_variants')
        .select('stock_qty')
        .eq('product_id', productId);

      let allBelowFive = false;
      if (variants && variants.length > 0) {
        allBelowFive = variants.every((v: any) => (v.stock_qty ?? 0) < 5);
      } else if (typeof stockQty === 'number') {
        allBelowFive = stockQty < 5;
      }

      const newInStock = !allBelowFive;
      await supabase
        .from('products')
        .update({ in_stock: newInStock })
        .eq('id', productId);

      try {
        await supabase.from('audit_logs').insert({
          action: 'UPDATE_VARIANT_STOCK_PRICE',
          details: { variantId, productId, updatePayload, newInStock },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, inStock: newInStock, autoDisabled: allBelowFive });
    }

    // c) TOGGLE_PRODUCT_STOCK
    if (action === 'TOGGLE_PRODUCT_STOCK') {
      const { productId, inStock } = body;
      if (!productId || typeof inStock !== 'boolean') {
        return NextResponse.json({ error: 'productId and inStock required' }, { status: 400 });
      }

      await supabase
        .from('products')
        .update({ in_stock: inStock })
        .eq('id', productId);

      try {
        await supabase.from('audit_logs').insert({
          action: 'TOGGLE_PRODUCT_STOCK',
          details: { productId, inStock },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, productId, inStock });
    }

    // d) TOGGLE_STORE_STATUS
    if (action === 'TOGGLE_STORE_STATUS') {
      const { enabled } = body;
      if (typeof enabled !== 'boolean') {
        return NextResponse.json({ error: 'enabled boolean required' }, { status: 400 });
      }

      await supabase
        .from('feature_flags')
        .upsert({ key: 'accepting_orders', enabled })
        .eq('key', 'accepting_orders');

      try {
        await supabase.from('audit_logs').insert({
          action: 'TOGGLE_STORE_STATUS',
          details: { acceptingOrders: enabled },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, acceptingOrders: enabled });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    logger.error('ADMIN_PATCH_FAILED', 'Failed to process admin action', { error: err.message });
    return NextResponse.json({ error: err.message || 'Operation failed' }, { status: 500 });
  }
}

// POST /api/admin: Gayoo POS CSV Bulk Sync Engine
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rows: CsvRowPayload[] = Array.isArray(body) ? body : body.rows;

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'Rows array required' }, { status: 400 });
    }

    let updatedCount = 0;
    let autoDisabledCount = 0;

    for (const row of rows) {
      const queryName = (row.itemNameOrId || '').trim();
      if (!queryName) continue;

      // 1. Find product by id or case-insensitive name_en
      const { data: matchedProducts } = await supabase
        .from('products')
        .select('id, name_en')
        .or(`id.eq.${queryName},name_en.ilike.%${queryName}%`)
        .limit(1);

      if (!matchedProducts || matchedProducts.length === 0) continue;
      const product = matchedProducts[0];

      // 2. Find matching variant by label or default
      const { data: variants } = await supabase
        .from('product_variants')
        .select('*')
        .eq('product_id', product.id);

      let targetVariant = null;
      if (variants && variants.length > 0) {
        if (row.variantLabel) {
          targetVariant = variants.find((v: any) =>
            v.label.toLowerCase().includes((row.variantLabel || '').toLowerCase())
          );
        }
        if (!targetVariant) targetVariant = variants[0];
      }

      const updatePayload: Record<string, any> = {};
      if (typeof row.price === 'number') updatePayload.price = row.price;
      if (typeof row.mrp === 'number') updatePayload.mrp = row.mrp;
      if (typeof row.stockQty === 'number') updatePayload.stock_qty = row.stockQty;

      if (targetVariant && Object.keys(updatePayload).length > 0) {
        await supabase
          .from('product_variants')
          .update(updatePayload)
          .eq('id', targetVariant.id);
        updatedCount++;
      }

      // Check < 5 stock buffer rule
      const stock = typeof row.stockQty === 'number' ? row.stockQty : targetVariant?.stock_qty;
      if (typeof stock === 'number' && stock < 5) {
        await supabase
          .from('products')
          .update({ in_stock: false })
          .eq('id', product.id);
        autoDisabledCount++;
      } else if (typeof stock === 'number' && stock >= 5) {
        await supabase
          .from('products')
          .update({ in_stock: true })
          .eq('id', product.id);
      }
    }

    // Log the sync
    try {
      await supabase.from('audit_logs').insert({
        action: 'GAYOO_CSV_SYNC',
        details: { updatedCount, autoDisabledCount, timestamp: new Date().toISOString() },
        timestamp: new Date().toISOString(),
      });
    } catch {}

    logger.info('GAYOO_SYNC_COMPLETED', `Gayoo POS CSV synced: ${updatedCount} updated, ${autoDisabledCount} auto-disabled`, {
      updatedCount,
      autoDisabledCount,
    });

    return NextResponse.json({
      success: true,
      updatedCount,
      autoDisabledCount,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    logger.error('GAYOO_SYNC_FAILED', 'Failed to execute Gayoo CSV sync', { error: err.message });
    return NextResponse.json({ error: err.message || 'CSV sync failed' }, { status: 500 });
  }
}
