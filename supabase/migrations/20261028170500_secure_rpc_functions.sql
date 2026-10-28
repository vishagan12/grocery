-- =====================================================================
-- Migration: 20261028170500_secure_rpc_functions.sql
-- Description: Creates secure, atomic RPC stored functions for rider
--              status progression and admin dispatch assignment.
--
-- Allowed Rider Status Transitions:
--   - 0 (Placed) or 1 (Packed/Ready) -> 2 (On Route)
--   - 2 (On Route) -> 3 (Delivered)
--   - Any status regression (e.g. 2 -> 1, 3 -> 2) is strictly rejected.
--   - Modifying cancelled orders (status 4 / -1) or changing pricing is forbidden.
-- =====================================================================

BEGIN;

-- 1. rider_update_order_status
-- Updates status atomically with row lock, verifies rider assignment,
-- and forbids altering financial amounts or customer details.
CREATE OR REPLACE FUNCTION public.rider_update_order_status(
  p_order_id text,
  p_new_status integer,
  p_payment_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rider record;
  v_order record;
  v_new_payment_status text;
BEGIN
  -- 1. Authorization check: must have rider role
  IF NOT public.is_rider() THEN
    RAISE EXCEPTION 'Unauthorized: Rider role required' USING ERRCODE = '42501';
  END IF;

  -- 2. Lookup the authenticated rider profile
  SELECT * INTO v_rider
  FROM public.riders
  WHERE user_id = (SELECT auth.uid());

  IF v_rider IS NULL THEN
    RAISE EXCEPTION 'Rider profile not found for authenticated user' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_rider.is_active THEN
    RAISE EXCEPTION 'Rider account is deactivated' USING ERRCODE = '0A000';
  END IF;

  -- 3. Lock order row for update
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id USING ERRCODE = 'P0002';
  END IF;

  -- 4. Verify order is assigned to this rider
  IF v_order.assigned_rider_id IS DISTINCT FROM v_rider.id THEN
    RAISE EXCEPTION 'Unauthorized: Order % is not assigned to rider %', p_order_id, v_rider.username
      USING ERRCODE = '42501';
  END IF;

  -- 5. Validate status transition lifecycle
  -- Allowed:
  --   0 (Placed) or 1 (Packed/Ready) -> 2 (On Route)
  --   2 (On Route) -> 3 (Delivered)
  IF p_new_status = 2 THEN
    IF v_order.status NOT IN (0, 1) THEN
      RAISE EXCEPTION 'Invalid status transition: Order % is currently status %, cannot move to 2 (On Route)',
        p_order_id, v_order.status USING ERRCODE = '22023';
    END IF;
  ELSIF p_new_status = 3 THEN
    IF v_order.status != 2 THEN
      RAISE EXCEPTION 'Invalid status transition: Order % must be On Route (2) before marking Delivered (3). Current status: %',
        p_order_id, v_order.status USING ERRCODE = '22023';
    END IF;
  ELSE
    RAISE EXCEPTION 'Forbidden status %: Riders may only transition to 2 (On Route) or 3 (Delivered)',
      p_new_status USING ERRCODE = '22023';
  END IF;

  -- Determine final payment status on delivery
  v_new_payment_status := COALESCE(
    p_payment_status,
    CASE WHEN p_new_status = 3 THEN 'paid' ELSE v_order.payment_status END
  );

  -- 6. Apply state change (never touch prices, items, or assignment)
  UPDATE public.orders
  SET status = p_new_status,
      payment_status = v_new_payment_status,
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'status', v_order.status,
    'payment_status', v_order.payment_status,
    'assigned_rider_id', v_order.assigned_rider_id,
    'updated_at', v_order.updated_at
  );
END;
$$;

-- 2. admin_assign_rider
-- Locks order, validates active rider, enforces safe assignment rules
CREATE OR REPLACE FUNCTION public.admin_assign_rider(
  p_order_id text,
  p_rider_id uuid,
  p_force_reassign boolean DEFAULT false
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rider record;
  v_current_rider record;
  v_order record;
BEGIN
  -- 1. Authorization check: must have admin role
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Unauthorized: Admin role required' USING ERRCODE = '42501';
  END IF;

  -- 2. Validate target rider
  SELECT * INTO v_rider
  FROM public.riders
  WHERE id = p_rider_id;

  IF v_rider IS NULL THEN
    RAISE EXCEPTION 'Target rider % not found', p_rider_id USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_rider.is_active THEN
    RAISE EXCEPTION 'Cannot assign rider %: Rider is currently inactive', v_rider.full_name
      USING ERRCODE = '22023';
  END IF;

  -- 3. Lock order row for update
  SELECT * INTO v_order
  FROM public.orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF v_order IS NULL THEN
    RAISE EXCEPTION 'Order % not found', p_order_id USING ERRCODE = 'P0002';
  END IF;

  -- 4. Check existing assignment if different
  IF v_order.assigned_rider_id IS NOT NULL AND v_order.assigned_rider_id != p_rider_id THEN
    SELECT * INTO v_current_rider
    FROM public.riders
    WHERE id = v_order.assigned_rider_id;

    IF v_current_rider IS NOT NULL AND v_current_rider.is_active AND NOT p_force_reassign THEN
      RAISE EXCEPTION 'Order % is already assigned to active rider % (%). Pass p_force_reassign = true to reassign.',
        p_order_id, v_current_rider.full_name, v_current_rider.id
        USING ERRCODE = '22023';
    END IF;
  END IF;

  -- 5. Apply assignment and advance status to 1 (Packed/Ready) if currently 0 (Placed)
  UPDATE public.orders
  SET assigned_rider_id = p_rider_id,
      status = CASE WHEN status = 0 THEN 1 ELSE status END,
      updated_at = now()
  WHERE id = p_order_id
  RETURNING * INTO v_order;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order.id,
    'assigned_rider_id', v_order.assigned_rider_id,
    'rider_name', v_rider.full_name,
    'status', v_order.status,
    'updated_at', v_order.updated_at
  );
END;
$$;

-- 3. Revoke from public & anon, grant only to authenticated
REVOKE ALL ON FUNCTION public.rider_update_order_status(text, integer, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_assign_rider(text, uuid, boolean) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.rider_update_order_status(text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_rider(text, uuid, boolean) TO authenticated;

COMMIT;
