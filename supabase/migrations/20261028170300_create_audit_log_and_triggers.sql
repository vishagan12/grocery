-- =====================================================================
-- Migration: 20261028170300_create_audit_log_and_triggers.sql
-- Description: Creates public.audit_log table, triggers on sensitive
--              tables (products, variants, orders, riders, roles, flags),
--              and configures tamper-resistant RLS.
-- =====================================================================

BEGIN;

-- 1. Create public.audit_log table
CREATE TABLE IF NOT EXISTS public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  table_name text NOT NULL,
  row_id text NOT NULL,
  old_data jsonb,
  new_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_table_row ON public.audit_log(table_name, row_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at_desc ON public.audit_log(created_at DESC);

-- 2. Enable RLS on audit_log
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Admins may SELECT audit_log records
DROP POLICY IF EXISTS audit_log_admin_select ON public.audit_log;
CREATE POLICY audit_log_admin_select
  ON public.audit_log
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

-- Strictly NO direct INSERT/UPDATE/DELETE for clients (only SECURITY DEFINER triggers and service role)
DROP POLICY IF EXISTS audit_log_no_insert ON public.audit_log;
DROP POLICY IF EXISTS audit_log_no_update ON public.audit_log;
DROP POLICY IF EXISTS audit_log_no_delete ON public.audit_log;

-- 3. Audit Trigger Function (SECURITY DEFINER, search_path = '', redacts sensitive tokens)
CREATE OR REPLACE FUNCTION public.audit_log_trigger()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_actor_id uuid;
  v_row_id text;
  v_old_data jsonb;
  v_new_data jsonb;
BEGIN
  -- Determine current actor if authenticated
  BEGIN
    v_actor_id := (SELECT auth.uid());
  EXCEPTION WHEN OTHERS THEN
    v_actor_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_row_id := COALESCE(
      to_jsonb(OLD)->>'id', 
      to_jsonb(OLD)->>'user_id', 
      to_jsonb(OLD)->>'key', 
      'unknown'
    );
    v_old_data := to_jsonb(OLD) - 'order_secret' - 'secret' - 'password';
    v_new_data := NULL;
  ELSIF TG_OP = 'INSERT' THEN
    v_row_id := COALESCE(
      to_jsonb(NEW)->>'id', 
      to_jsonb(NEW)->>'user_id', 
      to_jsonb(NEW)->>'key', 
      'unknown'
    );
    v_old_data := NULL;
    v_new_data := to_jsonb(NEW) - 'order_secret' - 'secret' - 'password';
  ELSIF TG_OP = 'UPDATE' THEN
    v_row_id := COALESCE(
      to_jsonb(NEW)->>'id', 
      to_jsonb(NEW)->>'user_id', 
      to_jsonb(NEW)->>'key', 
      'unknown'
    );
    v_old_data := to_jsonb(OLD) - 'order_secret' - 'secret' - 'password';
    v_new_data := to_jsonb(NEW) - 'order_secret' - 'secret' - 'password';
  END IF;

  INSERT INTO public.audit_log (
    actor_id,
    action,
    table_name,
    row_id,
    old_data,
    new_data,
    created_at
  ) VALUES (
    v_actor_id,
    TG_OP,
    TG_TABLE_NAME,
    v_row_id,
    v_old_data,
    v_new_data,
    now()
  );

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.audit_log_trigger() FROM PUBLIC, anon, authenticated;

-- 4. Attach Triggers to Sensitive Tables

-- a) products (price/info/in_stock changes)
DROP TRIGGER IF EXISTS trg_audit_products ON public.products;
CREATE TRIGGER trg_audit_products
  AFTER INSERT OR UPDATE OR DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();

-- b) product_variants (price/stock changes)
DROP TRIGGER IF EXISTS trg_audit_product_variants ON public.product_variants;
CREATE TRIGGER trg_audit_product_variants
  AFTER INSERT OR UPDATE OR DELETE ON public.product_variants
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();

-- c) orders (status/rider assignment changes)
DROP TRIGGER IF EXISTS trg_audit_orders ON public.orders;
CREATE TRIGGER trg_audit_orders
  AFTER INSERT OR UPDATE OR DELETE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();

-- d) riders (fleet roster changes)
DROP TRIGGER IF EXISTS trg_audit_riders ON public.riders;
CREATE TRIGGER trg_audit_riders
  AFTER INSERT OR UPDATE OR DELETE ON public.riders
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();

-- e) user_roles (role grants and modifications)
DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
CREATE TRIGGER trg_audit_user_roles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_log_trigger();

-- f) feature_flags (store settings/killswitches)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'feature_flags') THEN
    DROP TRIGGER IF EXISTS trg_audit_feature_flags ON public.feature_flags;
    CREATE TRIGGER trg_audit_feature_flags
      AFTER INSERT OR UPDATE OR DELETE ON public.feature_flags
      FOR EACH ROW
      EXECUTE FUNCTION public.audit_log_trigger();
  END IF;
END $$;

COMMIT;
