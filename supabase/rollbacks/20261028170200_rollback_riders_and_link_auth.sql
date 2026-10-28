-- =====================================================================
-- Rollback: 20261028170200_rollback_riders_and_link_auth.sql
-- Description: Reverses 20261028170200_create_riders_and_link_auth.sql
-- =====================================================================

BEGIN;

DROP INDEX IF EXISTS idx_riders_is_active;
DROP INDEX IF EXISTS idx_riders_username;
DROP INDEX IF EXISTS idx_riders_user_id;

DROP INDEX IF EXISTS idx_order_items_order_id;
DROP INDEX IF EXISTS idx_addresses_user_id;

DROP INDEX IF EXISTS idx_orders_created_at_desc;
DROP INDEX IF EXISTS idx_orders_status;
DROP INDEX IF EXISTS idx_orders_assigned_rider_id;
DROP INDEX IF EXISTS idx_orders_user_id;

ALTER TABLE public.addresses DROP COLUMN IF EXISTS user_id;

ALTER TABLE public.orders DROP COLUMN IF EXISTS assigned_rider_id;
ALTER TABLE public.orders DROP COLUMN IF EXISTS user_id;

DROP TABLE IF EXISTS public.riders CASCADE;

COMMIT;
