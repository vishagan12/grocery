-- =====================================================================
-- Migration: 20261028170600_storage_security_policies.sql
-- Description: Configures storage buckets and RLS security policies on
--              storage.objects.
--
-- Buckets:
--   - product-images: Public read, admin-only upload/update/delete.
--     Limits: 5MB max file size, image MIME types only.
-- =====================================================================

BEGIN;

-- 1. Create or configure 'product-images' bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880, -- 5 MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

-- 2. Storage Objects RLS Policies

-- a) Public Read for product-images
DROP POLICY IF EXISTS product_images_public_read ON storage.objects;
CREATE POLICY product_images_public_read
  ON storage.objects
  FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'product-images');

-- b) Admin Insert into product-images
DROP POLICY IF EXISTS product_images_admin_insert ON storage.objects;
CREATE POLICY product_images_admin_insert
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT public.is_admin())
  );

-- c) Admin Update in product-images
DROP POLICY IF EXISTS product_images_admin_update ON storage.objects;
CREATE POLICY product_images_admin_update
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (SELECT public.is_admin())
  )
  WITH CHECK (
    bucket_id = 'product-images'
    AND (SELECT public.is_admin())
  );

-- d) Admin Delete from product-images
DROP POLICY IF EXISTS product_images_admin_delete ON storage.objects;
CREATE POLICY product_images_admin_delete
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (SELECT public.is_admin())
  );

COMMIT;
