-- =====================================================================
-- Migration: 20261030100000_drop_legacy_open_policies.sql
-- Description: Drops legacy permissive policies that allowed open public
--              access to sensitive customer tables (addresses, orders, order_items).
--
-- CAUSE & RATIONALE:
-- These old permissive policies were never dropped by migration 20261028170400.
-- Postgres combines multiple permissive policies on a table using boolean OR.
-- Consequently, these legacy policies completely defeated the strict customer/rider
-- RLS policies, allowing any logged-in user (authenticated) or public caller to read
-- all customers' orders, order items, and addresses, as well as update or delete
-- any customer's addresses.
-- =====================================================================

BEGIN;

DROP POLICY IF EXISTS "Allow public access on addresses" ON public.addresses;
DROP POLICY IF EXISTS "Allow public select order_items" ON public.order_items;
DROP POLICY IF EXISTS "Allow public select orders" ON public.orders;

COMMIT;
