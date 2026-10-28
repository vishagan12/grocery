-- =====================================================================
-- Rollback: 20261028170600_rollback_storage_security_policies.sql
-- Description: Reverses 20261028170600_storage_security_policies.sql
-- =====================================================================

BEGIN;

DROP POLICY IF EXISTS product_images_admin_delete ON storage.objects;
DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
DROP POLICY IF EXISTS product_images_admin_insert ON storage.objects;
DROP POLICY IF EXISTS product_images_public_read ON storage.objects;

DELETE FROM storage.buckets WHERE id = 'product-images';

COMMIT;
