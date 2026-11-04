-- =====================================================================
-- Rollback Migration: 20261104110000_rollback_create_place_order_atomic.sql
-- Description: Reverses 20261104110000_create_place_order_atomic.sql
-- =====================================================================

BEGIN;

DROP FUNCTION IF EXISTS public.place_order_atomic(
  text, text, text, text, double precision, double precision, numeric, text, text, text, jsonb, boolean, text, text
);

COMMIT;
