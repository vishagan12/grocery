-- =====================================================================
-- Rollback: 20261105100000_rollback_high_concurrency_query_indexes.sql
-- Description: Drops composite indexes added in 20261105100000.
-- =====================================================================

BEGIN;

DROP INDEX IF EXISTS public.idx_orders_status_created_desc;
DROP INDEX IF EXISTS public.idx_orders_rider_created_desc;
DROP INDEX IF EXISTS public.idx_orders_phone_secret;
DROP INDEX IF EXISTS public.idx_products_cat_stock_id;
DROP INDEX IF EXISTS public.idx_order_items_order_prod;
DROP INDEX IF EXISTS public.idx_addresses_phone;

COMMIT;
