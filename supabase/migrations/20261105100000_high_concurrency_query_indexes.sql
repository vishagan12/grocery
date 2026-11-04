-- =====================================================================
-- Migration: 20261105100000_high_concurrency_query_indexes.sql
-- Description: Composite and covering indexes tailored for 500+ concurrent users:
--              1. idx_orders_status_created_desc (Admin orders queue by status & date)
--              2. idx_orders_rider_created_desc (Rider active/delivered orders filtered by rider and sorted by date)
--              3. idx_orders_phone_secret (Customer secure tracking and polling lookup)
--              4. idx_products_cat_stock_id (Category browsing with in-stock priority)
--              5. idx_order_items_order_prod (Order items join acceleration)
--              6. idx_addresses_phone (Customer delivery address sync by phone)
-- =====================================================================

BEGIN;

-- 1. Accelerates Admin Orders filtering by status and sorting by created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_status_created_desc
  ON public.orders (status, created_at DESC);

-- 2. Accelerates Rider Orders filtering by assigned_rider_id and created_at DESC
CREATE INDEX IF NOT EXISTS idx_orders_rider_created_desc
  ON public.orders (assigned_rider_id, created_at DESC);

-- 3. Accelerates Customer Order verification & live tracking polling (phone + order_secret)
CREATE INDEX IF NOT EXISTS idx_orders_phone_secret
  ON public.orders (phone, order_secret)
  WHERE order_secret IS NOT NULL;

-- 4. Accelerates Category view filtering by category_id with in_stock sorting & id tie-breaker
CREATE INDEX IF NOT EXISTS idx_products_cat_stock_id
  ON public.products (category_id, in_stock DESC, id);

-- 5. Accelerates order_items lookups and product joins for invoice generation & rider view
CREATE INDEX IF NOT EXISTS idx_order_items_order_prod
  ON public.order_items (order_id, product_id);

-- 6. Accelerates saved address retrieval by customer phone during checkout
CREATE INDEX IF NOT EXISTS idx_addresses_phone
  ON public.addresses (phone);

COMMIT;
