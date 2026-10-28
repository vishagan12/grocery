-- =====================================================================
-- Rollback: 20261028170300_rollback_audit_log_and_triggers.sql
-- Description: Reverses 20261028170300_create_audit_log_and_triggers.sql
-- =====================================================================

BEGIN;

DROP TRIGGER IF EXISTS trg_audit_feature_flags ON public.feature_flags;
DROP TRIGGER IF EXISTS trg_audit_user_roles ON public.user_roles;
DROP TRIGGER IF EXISTS trg_audit_riders ON public.riders;
DROP TRIGGER IF EXISTS trg_audit_orders ON public.orders;
DROP TRIGGER IF EXISTS trg_audit_product_variants ON public.product_variants;
DROP TRIGGER IF EXISTS trg_audit_products ON public.products;

DROP FUNCTION IF EXISTS public.audit_log_trigger();

DROP POLICY IF EXISTS audit_log_admin_select ON public.audit_log;

DROP TABLE IF EXISTS public.audit_log CASCADE;

COMMIT;
