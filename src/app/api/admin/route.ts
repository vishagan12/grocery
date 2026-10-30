import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase as defaultAnonSupabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import { sanitizeInput } from '@/lib/resilience';
import { products as fallbackCatalog, categories as fallbackCategories } from '@/data/products';
import { parseDeliverySlot, formatDeliverySlot, applyOrderOverlay, setOrderOverlay } from '@/lib/order-utils';
import { requireAdmin, createServerAdminClient, riderUsernameToSyntheticEmail } from '@/lib/serverAuth';

export const dynamic = 'force-dynamic';

interface CsvRowPayload {
  itemNameOrId?: string;
  variantLabel?: string;
  price?: number;
  mrp?: number;
  stockQty?: number;
}

// Allowed order status values
const ALLOWED_ORDER_STATUSES = new Set([0, 1, 2, 3, 4]);

// URL validation helper (http/https only)
function isValidImageUrl(urlStr: string): boolean {
  if (!urlStr || typeof urlStr !== 'string') return false;
  try {
    const parsed = new URL(urlStr);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // 1. Enforce admin role authentication
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) {
    return auth;
  }
  const sessionDb = auth.supabase;

  try {
    // 1. Fetch recent orders using admin session client (RLS applies)
    const { data: rawOrders, error: ordersError } = await sessionDb
      .from('orders')
      .select('*, order_items(*)')
      .order('created_at', { ascending: false })
      .limit(100);

    // 2. Fetch products and their variants
    const { data: rawProducts, error: productsError } = await sessionDb
      .from('products')
      .select('*, product_variants(*)');

    // 3. Fetch categories
    const { data: rawCategories } = await sessionDb
      .from('categories')
      .select('*');

    // 4. Fetch registered riders for the admin riders view
    const { data: rawRiders } = await sessionDb
      .from('riders')
      .select('*')
      .order('created_at', { ascending: false });

    let categories = fallbackCategories;
    if (rawCategories && rawCategories.length > 0) {
      categories = rawCategories.map((c: any) => ({
        id: c.id,
        nameEn: c.name_en,
        nameTa: c.name_ta || '',
        image: c.image || '',
      }));
    }

    // 5. Fetch feature flags (e.g. accepting_orders)
    const { data: rawFlags } = await sessionDb
      .from('feature_flags')
      .select('key, enabled');

    let isAcceptingOrders = true;
    if (rawFlags && Array.isArray(rawFlags)) {
      const flag = rawFlags.find((f: any) => f.key === 'accepting_orders');
      if (flag) isAcceptingOrders = Boolean(flag.enabled);
    }

    // Merge or fallback catalog if table is empty or errored
    let catalog: any[] = [];
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

    const orders = (rawOrders || []).map(applyOrderOverlay).map((o: any) => ({
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
      deliverySlot: parseDeliverySlot(o.delivery_slot).slot,
      createdAt: o.created_at || new Date().toISOString(),
      isForSomeoneElse: Boolean(o.is_for_someone_else),
      recipientName: o.recipient_name || undefined,
      recipientPhone: o.recipient_phone || undefined,
      assignedRiderId: o.assigned_rider_id || undefined,
      assignedRiderName: o.assigned_rider_name || parseDeliverySlot(o.delivery_slot).riderName || undefined,
      assignedRiderPhone: o.assigned_rider_phone || parseDeliverySlot(o.delivery_slot).riderPhone || undefined,
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

    const riders = (rawRiders || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      username: r.username,
      name: r.full_name,
      phone: r.phone,
      vehicle: r.vehicle_info || 'Hero Splendor',
      vehiclePlate: '',
      isActive: Boolean(r.is_active),
      status: r.is_active ? 'available' : 'offline',
      joinedDate: r.created_at ? r.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
    }));

    return NextResponse.json({
      orders,
      catalog,
      categories,
      riders,
      acceptingOrders: isAcceptingOrders,
    });
  } catch (err: any) {
    logger.error('ADMIN_GET_FAILED', 'Failed to fetch admin dashboard data', { error: err.message });
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  // 1. Enforce admin role authentication
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) {
    return auth;
  }
  const sessionDb = auth.supabase;

  try {
    const body = await req.json();
    const { action } = body;

    if (!action || typeof action !== 'string') {
      return NextResponse.json({ error: 'Valid action is required' }, { status: 400 });
    }

    // -------------------------------------------------------------------------
    // a) UPDATE_ORDER_STATUS
    // -------------------------------------------------------------------------
    if (action === 'UPDATE_ORDER_STATUS') {
      const { orderId, status, paymentStatus } = body;
      if (!orderId || typeof status !== 'number' || !ALLOWED_ORDER_STATUSES.has(status)) {
        return NextResponse.json({ error: 'Valid orderId and numeric status (0-4) required' }, { status: 400 });
      }

      const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };
      if (paymentStatus) {
        if (typeof paymentStatus !== 'string' || !['pending', 'paid', 'failed', 'cancelled'].includes(paymentStatus)) {
          return NextResponse.json({ error: 'Invalid paymentStatus' }, { status: 400 });
        }
        updateData.payment_status = paymentStatus;
      }

      setOrderOverlay(orderId, { status, paymentStatus });

      const { error } = await sessionDb
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      try {
        await sessionDb.from('audit_logs').insert({
          action: 'UPDATE_ORDER_STATUS',
          details: { orderId, status, paymentStatus },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      logger.info('ADMIN_ORDER_STATUS_UPDATED', `Order ${orderId} updated to status ${status}`, { orderId, status });
      return NextResponse.json({ success: true, orderId, status });
    }

    // -------------------------------------------------------------------------
    // b) UPDATE_VARIANT_STOCK_PRICE
    // -------------------------------------------------------------------------
    if (action === 'UPDATE_VARIANT_STOCK_PRICE') {
      const { variantId, productId, price, mrp, stockQty } = body;
      if (!productId || typeof productId !== 'string') {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 });
      }

      // Input validations: price > 0, mrp >= price, stockQty >= 0
      const updatePayload: Record<string, any> = {};
      if (price !== undefined) {
        if (typeof price !== 'number' || price <= 0 || isNaN(price)) {
          return NextResponse.json({ error: 'Price must be a number greater than 0' }, { status: 400 });
        }
        updatePayload.price = price;
      }

      if (mrp !== undefined) {
        if (typeof mrp !== 'number' || mrp <= 0 || isNaN(mrp)) {
          return NextResponse.json({ error: 'MRP must be a number greater than 0' }, { status: 400 });
        }
        if (typeof price === 'number' && mrp < price) {
          return NextResponse.json({ error: 'MRP cannot be less than selling price' }, { status: 400 });
        }
        updatePayload.mrp = mrp;
      }

      if (stockQty !== undefined) {
        if (typeof stockQty !== 'number' || stockQty < 0 || isNaN(stockQty) || !Number.isInteger(stockQty)) {
          return NextResponse.json({ error: 'stockQty must be a non-negative integer' }, { status: 400 });
        }
        updatePayload.stock_qty = stockQty;
      }

      if (variantId) {
        await sessionDb
          .from('product_variants')
          .update(updatePayload)
          .eq('id', variantId);
      }

      // Enforce the < 5 stock buffer rule across all variants of this product
      const { data: variants } = await sessionDb
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
      await sessionDb
        .from('products')
        .update({ in_stock: newInStock })
        .eq('id', productId);

      try {
        await sessionDb.from('audit_logs').insert({
          action: 'UPDATE_VARIANT_STOCK_PRICE',
          details: { variantId, productId, updatePayload, newInStock },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, inStock: newInStock, autoDisabled: allBelowFive });
    }

    // -------------------------------------------------------------------------
    // c) TOGGLE_PRODUCT_STOCK
    // -------------------------------------------------------------------------
    if (action === 'TOGGLE_PRODUCT_STOCK') {
      const { productId, inStock } = body;
      if (!productId || typeof inStock !== 'boolean') {
        return NextResponse.json({ error: 'productId and boolean inStock required' }, { status: 400 });
      }

      await sessionDb
        .from('products')
        .update({ in_stock: inStock })
        .eq('id', productId);

      try {
        await sessionDb.from('audit_logs').insert({
          action: 'TOGGLE_PRODUCT_STOCK',
          details: { productId, inStock },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, productId, inStock });
    }

    // -------------------------------------------------------------------------
    // d) TOGGLE_STORE_STATUS
    // -------------------------------------------------------------------------
    if (action === 'TOGGLE_STORE_STATUS') {
      const { enabled } = body;
      if (typeof enabled !== 'boolean') {
        return NextResponse.json({ error: 'enabled boolean required' }, { status: 400 });
      }

      await sessionDb
        .from('feature_flags')
        .upsert({ key: 'accepting_orders', enabled })
        .eq('key', 'accepting_orders');

      try {
        await sessionDb.from('audit_logs').insert({
          action: 'TOGGLE_STORE_STATUS',
          details: { acceptingOrders: enabled },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, acceptingOrders: enabled });
    }

    // -------------------------------------------------------------------------
    // e) ASSIGN_RIDER (Uses admin_assign_rider RPC with admin's own session)
    // -------------------------------------------------------------------------
    if (action === 'ASSIGN_RIDER') {
      const { orderId, riderId, riderName, riderPhone, forceReassign } = body;
      if (!orderId) {
        return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
      }

      let targetRiderId = riderId;

      if (!targetRiderId && (riderPhone || riderName)) {
        let riderQuery = sessionDb.from('riders').select('id, full_name, phone').eq('is_active', true);
        if (riderPhone) {
          const cleanPhone = riderPhone.replace(/\D/g, '').slice(-10);
          riderQuery = riderQuery.ilike('phone', `%${cleanPhone}%`);
        } else if (riderName) {
          riderQuery = riderQuery.ilike('full_name', `%${riderName.trim()}%`);
        }
        const { data: matchedRiders } = await riderQuery.limit(1);
        if (matchedRiders && matchedRiders.length > 0) {
          targetRiderId = matchedRiders[0].id;
        }
      }

      if (!targetRiderId) {
        return NextResponse.json({ error: 'Valid active riderId or rider phone is required for assignment' }, { status: 400 });
      }

      // Invoke the authoritative RPC function with admin session
      const { data: rpcResult, error: rpcError } = await sessionDb.rpc('admin_assign_rider', {
        p_order_id: orderId,
        p_rider_id: targetRiderId,
        p_force_reassign: Boolean(forceReassign),
      });

      if (rpcError) {
        logger.error('ADMIN_ASSIGN_RIDER_RPC_FAILED', rpcError.message, { orderId, targetRiderId });
        return NextResponse.json({ error: rpcError.message || 'Failed to assign rider' }, { status: 400 });
      }

      // Sync delivery_slot and local overlay
      const { data: existingOrder } = await sessionDb
        .from('orders')
        .select('delivery_slot')
        .eq('id', orderId)
        .single();

      const newSlot = formatDeliverySlot(
        existingOrder?.delivery_slot,
        riderName ? sanitizeInput(riderName) : null,
        riderPhone ? sanitizeInput(riderPhone) : null
      );

      await sessionDb.from('orders').update({ delivery_slot: newSlot }).eq('id', orderId);

      setOrderOverlay(orderId, {
        status: 1,
        deliverySlot: newSlot,
        assignedRiderName: riderName ? sanitizeInput(riderName) : undefined,
        assignedRiderPhone: riderPhone ? sanitizeInput(riderPhone) : undefined,
      });

      try {
        await sessionDb.from('audit_logs').insert({
          action: 'ASSIGN_RIDER',
          details: { orderId, riderId, riderName },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, orderId, rpcResult });
    }

    // -------------------------------------------------------------------------
    // f) CANCEL_ORDER
    // -------------------------------------------------------------------------
    if (action === 'CANCEL_ORDER') {
      const { orderId, reason } = body;
      if (!orderId) {
        return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
      }

      const updateData: Record<string, any> = {
        status: 4, // 4: Cancelled / Void
        payment_status: 'cancelled',
        updated_at: new Date().toISOString(),
      };
      if (reason) updateData.notes = sanitizeInput(reason);

      const { error } = await sessionDb
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      try {
        await sessionDb.from('audit_logs').insert({
          action: 'CANCEL_ORDER',
          details: { orderId, reason },
          timestamp: new Date().toISOString(),
        });
      } catch {}

      return NextResponse.json({ success: true, orderId, status: 4 });
    }

    // -------------------------------------------------------------------------
    // g) CREATE_PRODUCT
    // -------------------------------------------------------------------------
    if (action === 'CREATE_PRODUCT') {
      const { product } = body;
      if (!product || !product.nameEn || !product.categoryId) {
        return NextResponse.json({ error: 'nameEn and categoryId are required' }, { status: 400 });
      }

      const id = product.id
        ? sanitizeInput(product.id)
        : sanitizeInput(product.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
      const nameEn = sanitizeInput(product.nameEn);
      const nameTa = sanitizeInput(product.nameTa || '');
      const categoryId = sanitizeInput(product.categoryId);

      let image = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
      if (product.image && isValidImageUrl(product.image)) {
        image = product.image;
      } else if (product.image) {
        return NextResponse.json({ error: 'Invalid product image URL' }, { status: 400 });
      }

      const inStock = typeof product.inStock === 'boolean' ? product.inStock : true;

      const variants = Array.isArray(product.variants) && product.variants.length > 0
        ? product.variants.map((v: any, idx: number) => {
            const price = Math.max(0.01, Number(v.price) || 0);
            const mrp = Math.max(price, Number(v.mrp) || price);
            const stockQty = Math.max(0, parseInt(v.stock_qty, 10) || 0);
            return {
              id: v.id || `${id}-v${idx + 1}`,
              product_id: id,
              label: sanitizeInput(v.label || '1 pack'),
              price,
              mrp,
              stock_qty: stockQty,
            };
          })
        : [{
            id: `${id}-v1`,
            product_id: id,
            label: 'Standard Pack',
            price: 50,
            mrp: 60,
            stock_qty: 20,
          }];

      try {
        await sessionDb.from('products').upsert({
          id,
          name_en: nameEn,
          name_ta: nameTa,
          category_id: categoryId,
          image,
          in_stock: inStock,
        });

        for (const v of variants) {
          await sessionDb.from('product_variants').upsert(v);
        }

        await sessionDb.from('audit_logs').insert({
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
          variants,
        },
      });
    }

    // -------------------------------------------------------------------------
    // h) UPDATE_PRODUCT
    // -------------------------------------------------------------------------
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
      if (product.image) {
        if (!isValidImageUrl(product.image)) {
          return NextResponse.json({ error: 'Invalid product image URL' }, { status: 400 });
        }
        updateData.image = product.image;
      }
      if (typeof product.inStock === 'boolean') updateData.in_stock = product.inStock;

      try {
        await sessionDb.from('products').update(updateData).eq('id', id);

        if (Array.isArray(product.variants)) {
          for (const v of product.variants) {
            if (v.id) {
              const price = Math.max(0.01, Number(v.price) || 0);
              const mrp = Math.max(price, Number(v.mrp) || price);
              const stockQty = Math.max(0, parseInt(v.stock_qty, 10) || 0);

              await sessionDb.from('product_variants').upsert({
                id: v.id,
                product_id: id,
                label: sanitizeInput(v.label || '1 pack'),
                price,
                mrp,
                stock_qty: stockQty,
              });
            }
          }
        }

        await sessionDb.from('audit_logs').insert({
          action: 'UPDATE_PRODUCT',
          details: { id, updateData },
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        logger.warn('SUPABASE_PRODUCT_UPDATE_WARNING', err.message);
      }

      return NextResponse.json({ success: true, product });
    }

    // -------------------------------------------------------------------------
    // i) DELETE_PRODUCT
    // -------------------------------------------------------------------------
    if (action === 'DELETE_PRODUCT') {
      const { productId } = body;
      if (!productId) {
        return NextResponse.json({ error: 'productId is required' }, { status: 400 });
      }

      try {
        await sessionDb.from('product_variants').delete().eq('product_id', productId);
        await sessionDb.from('products').delete().eq('id', productId);

        await sessionDb.from('audit_logs').insert({
          action: 'DELETE_PRODUCT',
          details: { productId },
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        logger.warn('SUPABASE_PRODUCT_DELETE_WARNING', err.message);
      }

      return NextResponse.json({ success: true, productId });
    }

    // -------------------------------------------------------------------------
    // j) CREATE_CATEGORY / UPDATE_CATEGORY / DELETE_CATEGORY
    // -------------------------------------------------------------------------
    if (action === 'CREATE_CATEGORY' || action === 'UPDATE_CATEGORY') {
      const { category } = body;
      if (!category || !category.nameEn) {
        return NextResponse.json({ error: 'category.nameEn is required' }, { status: 400 });
      }

      const id = category.id
        ? sanitizeInput(category.id)
        : sanitizeInput(category.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
      const nameEn = sanitizeInput(category.nameEn);
      const nameTa = sanitizeInput(category.nameTa || '');
      let image = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80';
      if (category.image && isValidImageUrl(category.image)) {
        image = category.image;
      }

      try {
        await sessionDb.from('categories').upsert({ id, name_en: nameEn, name_ta: nameTa, image });
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
        await sessionDb.from('categories').delete().eq('id', categoryId);
      } catch (err: any) {
        logger.warn('SUPABASE_CATEGORY_DELETE_WARNING', err.message);
      }

      return NextResponse.json({ success: true, categoryId });
    }

    // -------------------------------------------------------------------------
    // k) BULK_TOGGLE_STOCK
    // -------------------------------------------------------------------------
    if (action === 'BULK_TOGGLE_STOCK') {
      const { productIds, inStock } = body;
      if (!Array.isArray(productIds) || typeof inStock !== 'boolean') {
        return NextResponse.json({ error: 'productIds array and inStock boolean required' }, { status: 400 });
      }

      try {
        await sessionDb.from('products').update({ in_stock: inStock }).in('id', productIds);
      } catch (err: any) {
        logger.warn('SUPABASE_BULK_TOGGLE_WARNING', err.message);
      }

      return NextResponse.json({ success: true, productIds, inStock });
    }

    // -------------------------------------------------------------------------
    // l) CREATE_RIDER (Admin creates new delivery partner)
    // Transactional creation with rollback using Service Role Client
    // -------------------------------------------------------------------------
    if (action === 'CREATE_RIDER') {
      const { username, fullName, phone, password, vehicleInfo } = body;

      // 1. Validation
      const cleanUsername = (username || '').trim().toLowerCase();
      if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
        return NextResponse.json({
          error: 'Username must be 3-30 characters with lowercase letters, digits, and underscores only',
        }, { status: 400 });
      }

      if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
        return NextResponse.json({ error: 'Full name is required (at least 2 characters)' }, { status: 400 });
      }

      const cleanPhone = (phone || '').replace(/\D/g, '').slice(-10);
      if (cleanPhone.length !== 10) {
        return NextResponse.json({ error: 'Valid 10-digit phone number is required' }, { status: 400 });
      }

      if (!password || typeof password !== 'string' || password.length < 6) {
        return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
      }

      const syntheticEmail = riderUsernameToSyntheticEmail(cleanUsername);
      const adminClient = createServerAdminClient();

      let createdAuthUserId: string | null = null;
      let createdRiderId: string | null = null;

      try {
        // Step 1: Create Supabase Auth User with auto-confirm
        const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
          email: syntheticEmail,
          password,
          email_confirm: true,
          user_metadata: { full_name: fullName.trim() },
        });

        if (authError || !authData.user) {
          logger.error('ADMIN_CREATE_RIDER_AUTH_FAILED', authError?.message || 'Failed to create auth user');
          return NextResponse.json({ error: authError?.message || 'Failed to create rider auth account' }, { status: 400 });
        }

        createdAuthUserId = authData.user.id;

        // Step 2: Insert into public.riders
        const { data: riderRow, error: riderError } = await adminClient
          .from('riders')
          .insert({
            user_id: createdAuthUserId,
            username: cleanUsername,
            full_name: fullName.trim(),
            phone: `+91-${cleanPhone}`,
            vehicle_info: vehicleInfo ? sanitizeInput(vehicleInfo) : 'Hero Splendor',
            is_active: true,
          })
          .select('id')
          .single();

        if (riderError || !riderRow) {
          throw new Error(`Rider table insert failed: ${riderError?.message}`);
        }

        createdRiderId = riderRow.id;

        // Step 3: Insert into public.user_roles (role = rider)
        const { error: roleError } = await adminClient
          .from('user_roles')
          .insert({
            user_id: createdAuthUserId,
            role: 'rider',
          });

        if (roleError) {
          throw new Error(`User roles insert failed: ${roleError?.message}`);
        }

        logger.info('ADMIN_RIDER_CREATED', `Created rider ${cleanUsername} (${createdRiderId})`);

        return NextResponse.json({
          success: true,
          rider: {
            id: createdRiderId,
            username: cleanUsername,
            fullName: fullName.trim(),
            phone: `+91-${cleanPhone}`,
          },
        });
      } catch (err: any) {
        // Compensating Transaction / Rollback
        logger.error('ADMIN_CREATE_RIDER_ROLLBACK', err.message);
        if (createdRiderId) {
          await adminClient.from('riders').delete().eq('id', createdRiderId);
        }
        if (createdAuthUserId) {
          await adminClient.from('user_roles').delete().eq('user_id', createdAuthUserId);
          await adminClient.auth.admin.deleteUser(createdAuthUserId);
        }
        return NextResponse.json({ error: 'Failed to create rider account. Changes rolled back.' }, { status: 500 });
      }
    }

    // -------------------------------------------------------------------------
    // m) TOGGLE_RIDER_ACTIVE
    // -------------------------------------------------------------------------
    if (action === 'TOGGLE_RIDER_ACTIVE') {
      const { riderId, isActive } = body;
      if (!riderId || typeof isActive !== 'boolean') {
        return NextResponse.json({ error: 'riderId and isActive boolean required' }, { status: 400 });
      }

      const { error } = await sessionDb
        .from('riders')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', riderId);

      if (error) throw error;

      return NextResponse.json({ success: true, riderId, isActive });
    }

    // -------------------------------------------------------------------------
    // n) RESET_RIDER_PASSWORD
    // -------------------------------------------------------------------------
    if (action === 'RESET_RIDER_PASSWORD') {
      const { riderId, newPassword } = body;
      if (!riderId || !newPassword || typeof newPassword !== 'string' || newPassword.length < 6) {
        return NextResponse.json({ error: 'riderId and newPassword (min 6 chars) required' }, { status: 400 });
      }

      // Fetch rider's auth user_id
      const { data: riderRow } = await sessionDb
        .from('riders')
        .select('user_id, username')
        .eq('id', riderId)
        .single();

      if (!riderRow || !riderRow.user_id) {
        return NextResponse.json({ error: 'Rider account not found' }, { status: 404 });
      }

      const adminClient = createServerAdminClient();
      const { error: resetErr } = await adminClient.auth.admin.updateUserById(riderRow.user_id, {
        password: newPassword,
      });

      if (resetErr) {
        return NextResponse.json({ error: resetErr.message }, { status: 400 });
      }

      logger.info('ADMIN_RESET_RIDER_PW', `Admin reset password for rider ${riderRow.username}`);
      return NextResponse.json({ success: true, riderId });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err: any) {
    logger.error('ADMIN_PATCH_FAILED', 'Failed to process admin action', { error: err.message });
    return NextResponse.json({ error: 'Operation failed' }, { status: 500 });
  }
}

// POST /api/admin: Gayoo POS CSV Bulk Sync Engine
export async function POST(req: NextRequest) {
  // 1. Enforce admin role authentication
  const auth = await requireAdmin(req);
  if (auth instanceof NextResponse) {
    return auth;
  }
  const sessionDb = auth.supabase;

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
      const { data: matchedProducts } = await sessionDb
        .from('products')
        .select('id, name_en')
        .or(`id.eq.${queryName},name_en.ilike.%${queryName}%`)
        .limit(1);

      if (!matchedProducts || matchedProducts.length === 0) continue;
      const product = matchedProducts[0];

      // 2. Find matching variant by label or default
      const { data: variants } = await sessionDb
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
      if (typeof row.price === 'number' && row.price > 0) updatePayload.price = row.price;
      if (typeof row.mrp === 'number' && row.mrp > 0) updatePayload.mrp = row.mrp;
      if (typeof row.stockQty === 'number' && row.stockQty >= 0) updatePayload.stock_qty = row.stockQty;

      if (targetVariant && Object.keys(updatePayload).length > 0) {
        await sessionDb
          .from('product_variants')
          .update(updatePayload)
          .eq('id', targetVariant.id);
        updatedCount++;
      }

      // Check < 5 stock buffer rule
      const stock = typeof row.stockQty === 'number' ? row.stockQty : targetVariant?.stock_qty;
      if (typeof stock === 'number' && stock < 5) {
        await sessionDb
          .from('products')
          .update({ in_stock: false })
          .eq('id', product.id);
        autoDisabledCount++;
      } else if (typeof stock === 'number' && stock >= 5) {
        await sessionDb
          .from('products')
          .update({ in_stock: true })
          .eq('id', product.id);
      }
    }

    // Log the sync
    try {
      await sessionDb.from('audit_logs').insert({
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
    return NextResponse.json({ error: 'CSV sync failed' }, { status: 500 });
  }
}
