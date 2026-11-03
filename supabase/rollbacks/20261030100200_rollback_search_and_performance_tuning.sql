-- =====================================================================
-- Rollback Migration: 20261030100200_rollback_search_and_performance_tuning.sql
-- Description: Reverses search functions, search document columns, and performance indexes.
-- =====================================================================

BEGIN;

-- 1. Drop functions
DROP FUNCTION IF EXISTS public.search_products_fast(text, int, int, text, int);
DROP FUNCTION IF EXISTS public.normalize_search(text);

-- 2. Drop performance and search indexes
DROP INDEX IF EXISTS public.idx_webhook_events_processed_at;
DROP INDEX IF EXISTS public.idx_webhook_events_event_id;
DROP INDEX IF EXISTS public.idx_audit_log_table_created;
DROP INDEX IF EXISTS public.idx_audit_log_created_at_desc;
DROP INDEX IF EXISTS public.idx_order_items_product_id;
DROP INDEX IF EXISTS public.idx_orders_rider_status;
DROP INDEX IF EXISTS public.idx_orders_user_status;
DROP INDEX IF EXISTS public.idx_orders_user_created_desc;
DROP INDEX IF EXISTS public.idx_product_variants_prod_price;
DROP INDEX IF EXISTS public.idx_product_variants_product_id;
DROP INDEX IF EXISTS public.idx_products_in_stock_true;
DROP INDEX IF EXISTS public.idx_products_in_stock;
DROP INDEX IF EXISTS public.idx_products_category_id;
DROP INDEX IF EXISTS public.idx_products_name_ta_trgm;
DROP INDEX IF EXISTS public.idx_products_search_doc_trgm;

-- 3. Drop generated search document and aliases columns
ALTER TABLE public.products DROP COLUMN IF EXISTS search_doc;
ALTER TABLE public.products DROP COLUMN IF EXISTS search_aliases;

COMMIT;
