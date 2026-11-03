-- =====================================================================
-- Migration: 20261030100100_add_orders_updated_at.sql
-- Description: Adds updated_at column to public.orders table.
--
-- RATIONALE:
-- Functions public.rider_update_order_status and public.admin_assign_rider
-- (defined in migration 20261028170500) execute:
--   UPDATE public.orders SET ..., updated_at = now() ...
-- However, public.orders did not originally have an updated_at column, causing
-- runtime errors when invoking those RPC functions.
-- =====================================================================

BEGIN;

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

COMMIT;
