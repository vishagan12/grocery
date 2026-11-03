-- =====================================================================
-- Rollback: 20261030100000_rollback_drop_legacy_open_policies.sql
-- Description: Reverses 20261030100000_drop_legacy_open_policies.sql
--
-- NOTE:
-- The original policy definitions for "Allow public access on addresses",
-- "Allow public select order_items", and "Allow public select orders" were legacy
-- unversioned staging policies not present in project migration files.
-- Restoring completely open public access to sensitive customer data is intentionally
-- not provided for security reasons. This rollback is a no-op.
-- =====================================================================

BEGIN;

-- No-op: Restoring open public access to customer data is intentionally omitted.

COMMIT;
