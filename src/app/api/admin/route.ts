import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/resilience';
import { products as fallbackCatalog, categories as fallbackCategories } from '@/data/products';

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

    // 3. Fetch categories
    const { data: rawCategories } = await supabase
      .from('categories')
      .select('*');

    let categories = fallbackCategories;
    if (rawCategories && rawCategories.length > 0) {
      categories = rawCategories.map((c: any) => ({
        id: c.id,
        nameEn: c.name_en,
        nameTa: c.name_ta || '',
        image: c.image || '',
      }));
    }

    // 4. Fetch feature flags (e.g. accepting_orders)
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
      assignedRiderName: o.assigned_rider_name || undefined,
      assignedRiderPhone: o.assigned_rider_phone || undefined,
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
      categories,
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

    // e) ASSIGN_RIDER
    if (action === 'ASSIGN_RIDER') {
      const { orderId, riderName, riderPhone } = body;
      if (!orderId) {
        return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
      }

      const updateData: Record<string, any> = {
        status: 1, // Ready at dock
      };
      if (riderName) updateData.assigned_rider_name = sanitizeInput(riderName);
      if (riderPhone) updateData.assigned_rider_phone = sanitizeInput(riderPhone);

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      try {
        await supabase.from('audit_logs').insert({
          action: 'ASSIGN_RIDER',
          details: { orderId, riderName, riderPhone },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, orderId, updateData });
    }

    // f) CANCEL_ORDER
    if (action === 'CANCEL_ORDER') {
      const { orderId, reason } = body;
      if (!orderId) {
        return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
      }

      const updateData: Record<string, any> = {
        status: 4, // 4: Cancelled / Void
        payment_status: 'cancelled',
      };
      if (reason) updateData.notes = sanitizeInput(reason);

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      try {
        await supabase.from('audit_logs').insert({
          action: 'CANCEL_ORDER',
          details: { orderId, reason },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, orderId, status: 4 });
    }

    // g) CREATE_PRODUCT
    if (action === 'CREATE_PRODUCT') {
      const { product } = body;
      if (!product || !product.nameEn || !product.categoryId) {
        return NextResponse.json({ error: 'nameEn and categoryId are required' }, { status: 400 });
      }

      const id = product.id ? sanitizeInput(product.id) : sanitizeInput(product.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
      const nameEn = sanitizeInput(product.nameEn);
      const nameTa = sanitizeInput(product.nameTa || '');
      const categoryId = sanitizeInput(product.categoryId);
      const image = product.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
      const inStock = typeof product.inStock === 'boolean' ? product.inStock : true;

      const variants = Array.isArray(product.variants) && product.variants.length > 0
        ? product.variants.map((v: any, idx: number) => ({
            id: v.id || `${id}-v${idx + 1}`,
            product_id: id,
            label: sanitizeInput(v.label || '1 pack'),
            price: Math.max(0, Number(v.price) || 0),
            mrp: Math.max(0, Number(v.mrp) || Number(v.price) || 0),
            stock_qty: Math.max(0, Number(v.stock_qty) || 0),
          }))
        : [{
            id: `${id}-v1`,
            product_id: id,
            label: 'Standard Pack',
            price: 50,
            mrp: 60,
            stock_qty: 20,
          }];

      try {
        await supabase.from('products').upsert({
          id,
          name_en: nameEn,
          name_ta: nameTa,
          category_id: categoryId,
          image,
          in_stock: inStock,
        });

        for (const v of variants) {
          await supabase.from('product_variants').upsert(v);
        }

        await supabase.from('audit_logs').insert({
          action: 'CREATE_PRODUCT',
          details: { id, nameEn, categoryId },
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        logger.warn('SUPABASE_PRODUCT_UPSERT_WARNING', err.message);
      }

      return NextResponse.json({
        success: true,
        product: {
          id,
          nameEn,
          nameTa,
          categoryId,
          image,
          inStock,
          variants: variants.map((v: any) => ({
            id: v.id,
            label: v.label,
            price: v.price,
            mrp: v.mrp,
            stock_qty: v.stock_qty,
          })),
        },
      });
    }

    // h) UPDATE_PRODUCT
    if (action === 'UPDATE_PRODUCT') {
      const { product } = body;
      if (!product || !product.id) {
        return NextResponse.json({ error: 'product.id is required' }, { status: 400 });
      }

      const id = product.id;
      const updateData: Record<string, any> = {};
      if (product.nameEn) updateData.name_en = sanitizeInput(product.nameEn);
      if (product.nameTa !== undefined) updateData.name_ta = sanitizeInput(product.nameTa);
      if (product.categoryId) updateData.category_id = sanitizeInput(product.categoryId);
      if (product.image) updateData.image = product.image;
      if (typeof product.inStock === 'boolean') updateData.in_stock = product.inStock;

      try {
        await supabase.from('products').update(updateData).eq('id', id);

        if (Array.isArray(product.variants)) {
          for (const v of product.variants) {
            if (v.id) {
              await supabase.from('product_variants').upsert({
                id: v.id,
                product_id: id,
                label: sanitizeInput(v.label || '1 pack'),
                price: Math.max(0, Number(v.price) || 0),
                mrp: Math.max(0, Number(v.mrp) || Number(v.price) || 0),
                stock_qty: Math.max(0, Number(v.stock_qty) || 0),
              });
            }
          }
        }

        await supabase.from('audit_logs').insert({
          action: 'UPDATE_PRODUCT',
          details: { id, updateData },
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        logger.warn('SUPABASE_PRODUCT_UPDATE_WARNING', err.message);
      }

      return NextResponse.json({ success: true, product });
    }

    // i) DELETE_PRODUCT
    if (action === 'DELETE_PRODUCT') {
      const { productId } = body;
      if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 });
      }

      try {
        await supabase.from('product_variants').delete().eq('product_id', productId);
        await supabase.from('products').delete().eq('id', productId);

        await supabase.from('audit_logs').insert({
          action: 'DELETE_PRODUCT',
          details: { productId },
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        logger.warn('SUPABASE_PRODUCT_DELETE_WARNING', err.message);
      }

      return NextResponse.json({ success: true, productId });
    }

    // j) CREATE_CATEGORY / UPDATE_CATEGORY / DELETE_CATEGORY
    if (action === 'CREATE_CATEGORY' || action === 'UPDATE_CATEGORY') {
      const { category } = body;
      if (!category || !category.nameEn) {
        return NextResponse.json({ error: 'category.nameEn is required' }, { status: 400 });
      }

      const id = category.id ? sanitizeInput(category.id) : sanitizeInput(category.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
      const nameEn = sanitizeInput(category.nameEn);
      const nameTa = sanitizeInput(category.nameTa || '');
      const image = category.image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';

      try {
        await supabase.from('categories').upsert({ id, name_en: nameEn, name_ta: nameTa, image });
      } catch (err: any) {
        logger.warn('SUPABASE_CATEGORY_UPSERT_WARNING', err.message);
      }

      return NextResponse.json({ success: true, category: { id, nameEn, nameTa, image } });
    }

    if (action === 'DELETE_CATEGORY') {
      const { categoryId } = body;
      if (!categoryId) {
        return NextResponse.json({ error: 'categoryId is required' }, { status: 400 });
      }

      try {
        await supabase.from('categories').delete().eq('id', categoryId);
      } catch (err: any) {
        logger.warn('SUPABASE_CATEGORY_DELETE_WARNING', err.message);
      }

      return NextResponse.json({ success: true, categoryId });
    }

    // k) BULK_TOGGLE_STOCK
    if (action === 'BULK_TOGGLE_STOCK') {
      const { productIds, inStock } = body;
      if (!Array.isArray(productIds) || typeof inStock !== 'boolean') {
        return NextResponse.json({ error: 'productIds array and inStock boolean required' }, { status: 400 });
      }

      try {
        await supabase.from('products').update({ in_stock: inStock }).in('id', productIds);
      } catch (err: any) {
        logger.warn('SUPABASE_BULK_TOGGLE_WARNING', err.message);
      }

      return NextResponse.json({ success: true, productIds, inStock });
    }
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
