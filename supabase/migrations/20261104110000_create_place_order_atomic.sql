-- =====================================================================
-- Migration: 20261104110000_create_place_order_atomic.sql
-- Description: Creates authoritative, server-only atomic order placement RPC
--              with strict idempotency, row locking on product_variants,
--              concurrency-safe stock deduction (stock cannot go negative),
--              and automatic stock deduction.
-- =====================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.place_order_atomic(
  p_idempotency_key text,
  p_customer_name text,
  p_phone text,
  p_address text,
  p_lat double precision,
  p_lng double precision,
  p_distance_km numeric,
  p_payment_method text,
  p_delivery_slot text,
  p_coupon_code text,
  p_items jsonb,
  p_is_for_someone_else boolean DEFAULT false,
  p_recipient_name text DEFAULT NULL,
  p_recipient_phone text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  v_existing_order record;
  v_order_id text;
  v_order_secret uuid;
  v_item record;
  v_variant record;
  v_subtotal numeric := 0;
  v_mrp_total numeric := 0;
  v_coupon_discount numeric := 0;
  v_delivery_fee numeric := 0;
  v_final_total numeric := 0;
  v_item_total numeric := 0;
  v_clean_coupon text;
  v_user_id uuid;
BEGIN
  -- 1. Idempotency Check: if order already exists with this idempotency key, return it immediately
  SELECT id, order_secret, total, subtotal, status
  INTO v_existing_order
  FROM public.orders
  WHERE idempotency_key = p_idempotency_key;

  IF v_existing_order.id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true,
      'order_id', v_existing_order.id,
      'order_secret', v_existing_order.order_secret,
      'total', v_existing_order.total,
      'status', v_existing_order.status,
      'idempotent_replay', true
    );
  END IF;

  -- 2. Validate input items array
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'Order must contain at least one item' USING ERRCODE = '22023';
  END IF;

  -- Determine user_id if authenticated caller
  BEGIN
    v_user_id := (SELECT auth.uid());
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  -- 3. Concurrency-Safe Stock & Price Validation with Row Locking (FOR UPDATE)
  -- Loop through each item in payload
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id text,
    variant_label text,
    quantity integer
  )
  LOOP
    IF v_item.quantity IS NULL OR v_item.quantity < 1 THEN
      RAISE EXCEPTION 'Invalid item quantity % for product %', v_item.quantity, v_item.product_id
        USING ERRCODE = '22023';
    END IF;

    -- Lock variant row exclusively to prevent concurrent over-allocation
    SELECT pv.id, pv.product_id, pv.label, pv.price, pv.mrp, pv.stock_qty
    INTO v_variant
    FROM public.product_variants pv
    WHERE pv.product_id = v_item.product_id
      AND (v_item.variant_label IS NULL OR lower(pv.label) = lower(v_item.variant_label))
    ORDER BY pv.price ASC
    LIMIT 1
    FOR UPDATE;

    IF v_variant.id IS NULL THEN
      -- Fallback to first variant for this product if label didn't match
      SELECT pv.id, pv.product_id, pv.label, pv.price, pv.mrp, pv.stock_qty
      INTO v_variant
      FROM public.product_variants pv
      WHERE pv.product_id = v_item.product_id
      ORDER BY pv.price ASC
      LIMIT 1
      FOR UPDATE;
    END IF;

    IF v_variant.id IS NULL THEN
      RAISE EXCEPTION 'Product variant not found for % (%)', v_item.product_id, v_item.variant_label
        USING ERRCODE = 'P0002';
    END IF;

    -- Strict non-negative stock enforcement
    IF v_variant.stock_qty < v_item.quantity THEN
      RAISE EXCEPTION 'Insufficient stock for % (%). Requested: %, Available: %',
        v_item.product_id, v_variant.label, v_item.quantity, v_variant.stock_qty
        USING ERRCODE = '55000'; -- Object not in prerequisite state
    END IF;

    -- Deduct stock atomically
    UPDATE public.product_variants
    SET stock_qty = stock_qty - v_item.quantity
    WHERE id = v_variant.id;

    -- Accumulate server-computed prices
    v_item_total := v_variant.price * v_item.quantity;
    v_subtotal := v_subtotal + v_item_total;
    v_mrp_total := v_mrp_total + (COALESCE(v_variant.mrp, v_variant.price) * v_item.quantity);
  END LOOP;

  -- 4. Server-Side Coupon & Delivery Fee Calculations
  v_clean_coupon := upper(trim(COALESCE(p_coupon_code, '')));
  IF v_clean_coupon IN ('AMMAN50', 'AMMA50', 'SAVE50') THEN
    v_coupon_discount := 50;
  ELSIF v_clean_coupon = 'FREEDEL' THEN
    v_coupon_discount := 30;
  ELSIF v_clean_coupon = 'MALIGAI100' THEN
    v_coupon_discount := 100;
  ELSE
    v_coupon_discount := 0;
  END IF;

  -- Free delivery over ₹499 or FREEDEL coupon
  IF v_subtotal >= 499 OR v_clean_coupon = 'FREEDEL' THEN
    v_delivery_fee := 0;
  ELSE
    v_delivery_fee := 30;
  END IF;

  v_final_total := GREATEST(0, (v_subtotal - v_coupon_discount) + v_delivery_fee);

  -- 5. Generate Secure IDs
  v_order_id := '#SAS-' || floor(1000 + random() * 9000)::text;
  v_order_secret := gen_random_uuid();

  -- 6. Insert Order Header
  INSERT INTO public.orders (
    id,
    user_id,
    phone,
    customer_name,
    address,
    subtotal,
    discount,
    delivery_fee,
    total,
    payment_method,
    payment_status,
    status,
    delivery_slot,
    idempotency_key,
    order_secret,
    is_for_someone_else,
    recipient_name,
    recipient_phone,
    created_at,
    updated_at
  ) VALUES (
    v_order_id,
    v_user_id,
    p_phone,
    p_customer_name,
    p_address,
    v_subtotal,
    ((v_mrp_total - v_subtotal) + v_coupon_discount),
    v_delivery_fee,
    v_final_total,
    p_payment_method,
    'pending',
    0,
    p_delivery_slot,
    p_idempotency_key,
    v_order_secret::text,
    p_is_for_someone_else,
    p_recipient_name,
    p_recipient_phone,
    now(),
    now()
  );

  -- 7. Insert Order Line Items
  FOR v_item IN SELECT * FROM jsonb_to_recordset(p_items) AS x(
    product_id text,
    variant_label text,
    quantity integer
  )
  LOOP
    SELECT pv.price, pv.label
    INTO v_variant
    FROM public.product_variants pv
    WHERE pv.product_id = v_item.product_id
      AND (v_item.variant_label IS NULL OR lower(pv.label) = lower(v_item.variant_label))
    LIMIT 1;

    INSERT INTO public.order_items (
      order_id,
      product_id,
      variant_label,
      price,
      quantity
    ) VALUES (
      v_order_id,
      v_item.product_id,
      COALESCE(v_variant.label, v_item.variant_label, '1 pack'),
      COALESCE(v_variant.price, 0),
      v_item.quantity
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'order_secret', v_order_secret::text,
    'subtotal', v_subtotal,
    'discount', ((v_mrp_total - v_subtotal) + v_coupon_discount),
    'delivery_fee', v_delivery_fee,
    'total', v_final_total,
    'idempotent_replay', false
  );
END;
$$;

-- Revoke from public, anon, and authenticated — accessible only via service_role / server
REVOKE ALL ON FUNCTION public.place_order_atomic(text, text, text, text, double precision, double precision, numeric, text, text, text, jsonb, boolean, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.place_order_atomic(text, text, text, text, double precision, double precision, numeric, text, text, text, jsonb, boolean, text, text) TO service_role;

COMMIT;
