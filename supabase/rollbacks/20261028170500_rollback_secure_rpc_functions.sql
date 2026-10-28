-- =====================================================================
-- Rollback: 20261028170500_rollback_secure_rpc_functions.sql
-- Description: Reverses 20261028170500_secure_rpc_functions.sql
-- =====================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.admin_assign_rider(text, uuid, boolean);
DROP FUNCTION IF EXISTS public.rider_update_order_status(text, integer, text);

COMMIT;
