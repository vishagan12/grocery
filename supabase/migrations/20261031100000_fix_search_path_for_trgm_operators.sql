-- =====================================================================
-- Migration: 20261031100000_fix_search_path_for_trgm_operators.sql
-- Description: Fixes search_path on search_products_fast to resolve pg_trgm
--              and unaccent operators (%, <->, similarity, unaccent), and drops
--              legacy two-argument overload to eliminate function call ambiguity.
--
-- CAUSE & RATIONALE:
-- Function public.search_products_fast was hardened with `SET search_path = ''`.
-- However, PostgreSQL operator resolution (such as the pg_trgm '%' operator and
-- unaccent functions) relies on the search_path to resolve non-schema-qualified
-- operators and functions. With an empty search path, PostgreSQL cannot resolve
-- `p.search_doc % v_norm_query` and fails on staging with:
--   ERROR 42883: operator does not exist: text % text
--
-- WHY 'search_path = public, extensions, pg_temp' IS SAFE:
-- In migration 20261028170400_revoke_and_enable_rls.sql, default privileges on
-- schema public were revoked:
--   REVOKE ALL ON ALL TABLES/ROUTINES IN SCHEMA public FROM anon, authenticated, PUBLIC;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ...;
-- Regular / unprivileged roles cannot create objects, tables, or shadow functions
-- in schema public. Including public, extensions, and pg_temp allows operator resolution
-- while retaining full security.
-- =====================================================================

BEGIN;

-- 1. Drop old two-argument overload public.search_products_fast(text, integer)
-- This old two-argument overload was replaced by the five-argument version
-- and can cause function call ambiguity in RPC invocations.
DROP FUNCTION IF EXISTS public.search_products_fast(text, integer);

-- 2. Update search_path for public.search_products_fast(text, integer, integer, text, integer)
ALTER FUNCTION public.search_products_fast(text, integer, integer, text, integer)
  SET search_path = public, extensions, pg_temp;

COMMIT;

