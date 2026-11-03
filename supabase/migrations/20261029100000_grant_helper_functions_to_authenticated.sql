-- =====================================================================
-- Migration: 20261029100000_grant_helper_functions_to_authenticated.sql
-- Description: Ensures role helper functions are explicitly executable by
--              authenticated and service_role, and revoked from anon.
--
-- CAUSE & RATIONALE:
-- Migration 20261028170100 initially granted execute on public.is_admin(),
-- public.is_rider(), and public.app_role() to authenticated.
-- However, subsequent migration 20261028170400 executed:
--   REVOKE ALL ON ALL ROUTINES IN SCHEMA public FROM anon, authenticated, PUBLIC;
-- which stripped the EXECUTE privilege on those helper functions from authenticated users.
-- As a result, RLS policies that call (SELECT public.is_admin()) or (SELECT public.is_rider())
-- fail with permission denied errors when evaluated for authenticated users.
-- This migration restores EXECUTE on the role helpers to authenticated and service_role,
-- while explicitly revoking them from anon.
-- =====================================================================

BEGIN;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_rider() FROM anon;
REVOKE EXECUTE ON FUNCTION public.app_role() FROM anon;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_rider() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated, service_role;

COMMIT;
