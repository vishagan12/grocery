-- =====================================================================
-- Rollback: 20261030100100_rollback_add_orders_updated_at.sql
-- Description: Reverses 20261030100100_add_orders_updated_at.sql
--              Drops updated_at column from public.orders if exists.
-- =====================================================================

BEGIN;

ALTER TABLE public.orders DROP COLUMN IF EXISTS updated_at;

COMMIT;
