-- =====================================================================
-- Rollback Migration: 20261031100000_rollback_fix_search_path_for_trgm_operators.sql
-- Description: Reverses 20261031100000_fix_search_path_for_trgm_operators.sql
--              by resetting search_path back to '' on public.search_products_fast.
--
-- NOTE ON search_products_fast(text, integer):
-- The dropped two-argument overload public.search_products_fast(text, integer)
-- is not restored here because its legacy definition does not exist in the project
-- version-controlled SQL files (it was superseded by the five-argument version).
-- =====================================================================

BEGIN;

-- 1. Reset search_path back to empty string
ALTER FUNCTION public.search_products_fast(text, integer, integer, text, integer)
  SET search_path = '';

COMMIT;

