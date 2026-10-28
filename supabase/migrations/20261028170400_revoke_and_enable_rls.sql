-- =====================================================================
-- Migration: 20261028170400_revoke_and_enable_rls.sql
-- Description: Revokes broad privileges, enforces default least privilege,
--              enables Row Level Security (RLS) on all public tables,
--              creates explicit role-based access policies, and sets
--              security_invoker = true on views.
-- =====================================================================

BEGIN;

-- 1. Revoke default and broad privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated, PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated, PUBLIC;
REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated, PUBLIC;

-- Fix default privileges for future objects created in schema public
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated, PUBLIC;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON ROUTINES FROM anon, authenticated, PUBLIC;

-- 2. Grant least privilege permissions back to anon and authenticated

-- Sequences: authenticated users need usage for serial/identity keys
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Public Catalog: anon & authenticated can SELECT catalog data
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.product_variants TO anon, authenticated;
GRANT SELECT ON public.categories TO anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_flags') THEN
    GRANT SELECT ON public.feature_flags TO anon, authenticated;
  END IF;
END $$;

-- Customer Operations: authenticated users may select/insert orders & order_items
GRANT SELECT, INSERT ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO authenticated;

-- Customer Address Book: authenticated users may select/insert/update/delete own addresses
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;

-- Riders Table: authenticated users may select profiles (further restricted by RLS)
GRANT SELECT ON public.riders TO authenticated;

-- User Roles Table: authenticated users may select their own role
GRANT SELECT ON public.user_roles TO authenticated;

-- Admin Tables & Writes: authenticated users (guarded strictly by RLS is_admin() checks)
GRANT ALL ON public.products TO authenticated;
GRANT ALL ON public.product_variants TO authenticated;
GRANT ALL ON public.categories TO authenticated;
GRANT ALL ON public.orders TO authenticated;
GRANT ALL ON public.order_items TO authenticated;
GRANT ALL ON public.addresses TO authenticated;
GRANT ALL ON public.riders TO authenticated;
GRANT ALL ON public.user_roles TO authenticated;
GRANT SELECT ON public.audit_log TO authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_flags') THEN
    GRANT ALL ON public.feature_flags TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    GRANT SELECT ON public.audit_logs TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhook_events') THEN
    GRANT SELECT ON public.webhook_events TO authenticated;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dead_letter_queue') THEN
    GRANT SELECT ON public.dead_letter_queue TO authenticated;
  END IF;
END $$;

-- 3. ENABLE RLS ON EVERY TABLE
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_flags') THEN
    ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhook_events') THEN
    ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dead_letter_queue') THEN
    ALTER TABLE public.dead_letter_queue ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 4. POLICIES: CATALOG TABLES

-- Products
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_public_select
  ON public.products
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS products_admin_all ON public.products;
CREATE POLICY products_admin_all
  ON public.products
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Product Variants
DROP POLICY IF EXISTS product_variants_public_select ON public.product_variants;
CREATE POLICY product_variants_public_select
  ON public.product_variants
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS product_variants_admin_all ON public.product_variants;
CREATE POLICY product_variants_admin_all
  ON public.product_variants
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Categories
DROP POLICY IF EXISTS categories_public_select ON public.categories;
CREATE POLICY categories_public_select
  ON public.categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS categories_admin_all ON public.categories;
CREATE POLICY categories_admin_all
  ON public.categories
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Feature Flags
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_flags') THEN
    DROP POLICY IF EXISTS feature_flags_public_select ON public.feature_flags;
    CREATE POLICY feature_flags_public_select
      ON public.feature_flags
      FOR SELECT
      TO anon, authenticated
      USING (true);

    DROP POLICY IF EXISTS feature_flags_admin_all ON public.feature_flags;
    CREATE POLICY feature_flags_admin_all
      ON public.feature_flags
      FOR ALL
      TO authenticated
      USING ((SELECT public.is_admin()))
      WITH CHECK ((SELECT public.is_admin()));
  END IF;
END $$;

-- 5. POLICIES: CUSTOMER DATA (ADDRESSES)
DROP POLICY IF EXISTS addresses_customer_select ON public.addresses;
CREATE POLICY addresses_customer_select
  ON public.addresses
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS addresses_customer_insert ON public.addresses;
CREATE POLICY addresses_customer_insert
  ON public.addresses
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS addresses_customer_update ON public.addresses;
CREATE POLICY addresses_customer_update
  ON public.addresses
  FOR UPDATE
  TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS addresses_customer_delete ON public.addresses;
CREATE POLICY addresses_customer_delete
  ON public.addresses
  FOR DELETE
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS addresses_admin_all ON public.addresses;
CREATE POLICY addresses_admin_all
  ON public.addresses
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 6. POLICIES: ORDERS & ORDER ITEMS

-- Orders: Customer can SELECT only their own orders
DROP POLICY IF EXISTS orders_customer_select ON public.orders;
CREATE POLICY orders_customer_select
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- =========================================================================
-- TEMPORARY POLICY:
-- REPLACE WITH SECURE FUNCTION IN NEXT PHASE (server must recalculate prices and stock)
-- Allows authenticated customers to place orders strictly with their own user_id
-- and initial status = 0 (Placed). Prevents modifying status or impersonating users.
-- =========================================================================
DROP POLICY IF EXISTS orders_customer_insert ON public.orders;
CREATE POLICY orders_customer_insert
  ON public.orders
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND status = 0
  );

-- Orders: Riders can SELECT only orders assigned to them
DROP POLICY IF EXISTS orders_rider_select ON public.orders;
CREATE POLICY orders_rider_select
  ON public.orders
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_rider())
    AND assigned_rider_id IN (
      SELECT id FROM public.riders WHERE user_id = (SELECT auth.uid())
    )
  );

-- Orders: Admins full access
DROP POLICY IF EXISTS orders_admin_all ON public.orders;
CREATE POLICY orders_admin_all
  ON public.orders
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- Order Items: Customer SELECT for their own orders
DROP POLICY IF EXISTS order_items_customer_select ON public.order_items;
CREATE POLICY order_items_customer_select
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = (SELECT auth.uid())
    )
  );

-- Order Items: Customer INSERT for their own orders
-- =========================================================================
-- TEMPORARY POLICY:
-- REPLACE WITH SECURE FUNCTION IN NEXT PHASE (server must recalculate prices and stock)
-- =========================================================================
DROP POLICY IF EXISTS order_items_customer_insert ON public.order_items;
CREATE POLICY order_items_customer_insert
  ON public.order_items
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_items.order_id
        AND o.user_id = (SELECT auth.uid())
    )
  );

-- Order Items: Rider SELECT for assigned orders
DROP POLICY IF EXISTS order_items_rider_select ON public.order_items;
CREATE POLICY order_items_rider_select
  ON public.order_items
  FOR SELECT
  TO authenticated
  USING (
    (SELECT public.is_rider())
    AND EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.riders r ON r.id = o.assigned_rider_id
      WHERE o.id = order_items.order_id
        AND r.user_id = (SELECT auth.uid())
    )
  );

-- Order Items: Admin full access
DROP POLICY IF EXISTS order_items_admin_all ON public.order_items;
CREATE POLICY order_items_admin_all
  ON public.order_items
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 7. POLICIES: RIDERS
DROP POLICY IF EXISTS riders_select_own ON public.riders;
CREATE POLICY riders_select_own
  ON public.riders
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS riders_admin_all ON public.riders;
CREATE POLICY riders_admin_all
  ON public.riders
  FOR ALL
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

-- 8. POLICIES: SENSITIVE & SYSTEM TABLES (audit_logs, webhook_events, dead_letter_queue)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;
    CREATE POLICY audit_logs_admin_select
      ON public.audit_logs
      FOR SELECT
      TO authenticated
      USING ((SELECT public.is_admin()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhook_events') THEN
    DROP POLICY IF EXISTS webhook_events_admin_select ON public.webhook_events;
    CREATE POLICY webhook_events_admin_select
      ON public.webhook_events
      FOR SELECT
      TO authenticated
      USING ((SELECT public.is_admin()));
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dead_letter_queue') THEN
    DROP POLICY IF EXISTS dead_letter_queue_admin_select ON public.dead_letter_queue;
    CREATE POLICY dead_letter_queue_admin_select
      ON public.dead_letter_queue
      FOR SELECT
      TO authenticated
      USING ((SELECT public.is_admin()));
  END IF;
END $$;

-- 9. Enforce security_invoker = true on all views in schema public
DO $$
DECLARE
  v_view_name text;
BEGIN
  FOR v_view_name IN (
    SELECT table_name FROM information_schema.views 
    WHERE table_schema = 'public'
  ) LOOP
    EXECUTE format('ALTER VIEW public.%I SET (security_invoker = true);', v_view_name);
  END LOOP;
END $$;

-- 10. Audit & secure existing database functions
DO $$
BEGIN
  -- If place_order_atomic exists, revoke from public and anon
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'place_order_atomic') THEN
    REVOKE ALL ON FUNCTION public.place_order_atomic FROM PUBLIC, anon;
    GRANT EXECUTE ON FUNCTION public.place_order_atomic TO authenticated;
  END IF;

  -- If search_products_fast exists, grant to anon and authenticated
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'search_products_fast') THEN
    GRANT EXECUTE ON FUNCTION public.search_products_fast TO anon, authenticated;
  END IF;
END $$;

COMMIT;
