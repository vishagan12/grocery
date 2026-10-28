-- =====================================================================
-- Rollback: 20261028170400_rollback_revoke_and_enable_rls.sql
-- Description: Reverses 20261028170400_revoke_and_enable_rls.sql
-- =====================================================================

BEGIN;

-- Drop Policies on Sensitive tables
DROP POLICY IF EXISTS dead_letter_queue_admin_select ON public.dead_letter_queue;
DROP POLICY IF EXISTS webhook_events_admin_select ON public.webhook_events;
DROP POLICY IF EXISTS audit_logs_admin_select ON public.audit_logs;

-- Drop Policies on Riders
DROP POLICY IF EXISTS riders_admin_all ON public.riders;
DROP POLICY IF EXISTS riders_select_own ON public.riders;

-- Drop Policies on Orders and Order Items
DROP POLICY IF EXISTS order_items_admin_all ON public.order_items;
DROP POLICY IF EXISTS order_items_rider_select ON public.order_items;
DROP POLICY IF EXISTS order_items_customer_insert ON public.order_items;
DROP POLICY IF EXISTS order_items_customer_select ON public.order_items;

DROP POLICY IF EXISTS orders_admin_all ON public.orders;
DROP POLICY IF EXISTS orders_rider_select ON public.orders;
DROP POLICY IF EXISTS orders_customer_insert ON public.orders;
DROP POLICY IF EXISTS orders_customer_select ON public.orders;

-- Drop Policies on Addresses
DROP POLICY IF EXISTS addresses_admin_all ON public.addresses;
DROP POLICY IF EXISTS addresses_customer_delete ON public.addresses;
DROP POLICY IF EXISTS addresses_customer_update ON public.addresses;
DROP POLICY IF EXISTS addresses_customer_insert ON public.addresses;
DROP POLICY IF EXISTS addresses_customer_select ON public.addresses;

-- Drop Policies on Catalog
DROP POLICY IF EXISTS feature_flags_admin_all ON public.feature_flags;
DROP POLICY IF EXISTS feature_flags_public_select ON public.feature_flags;

DROP POLICY IF EXISTS categories_admin_all ON public.categories;
DROP POLICY IF EXISTS categories_public_select ON public.categories;

DROP POLICY IF EXISTS product_variants_admin_all ON public.product_variants;
DROP POLICY IF EXISTS product_variants_public_select ON public.product_variants;

DROP POLICY IF EXISTS products_admin_all ON public.products;
DROP POLICY IF EXISTS products_public_select ON public.products;

-- Disable RLS if needed for clean rollback
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_variants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.riders DISABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_flags') THEN
    ALTER TABLE public.feature_flags DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'audit_logs') THEN
    ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'webhook_events') THEN
    ALTER TABLE public.webhook_events DISABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'dead_letter_queue') THEN
    ALTER TABLE public.dead_letter_queue DISABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- Restore standard default public permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO anon, authenticated;

COMMIT;
