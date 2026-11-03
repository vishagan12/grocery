-- =====================================================================
-- Rollback: 20261029100000_rollback_grant_helper_functions_to_authenticated.sql
-- Description: Reverses 20261029100000_grant_helper_functions_to_authenticated.sql
--              Revokes execute on role helper functions from authenticated
--              and service_role.
-- =====================================================================

BEGIN;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.is_rider() FROM authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.app_role() FROM authenticated, service_role;

COMMIT;
