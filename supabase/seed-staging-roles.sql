-- =====================================================================
-- File: supabase/seed-staging-roles.sql
-- Description: Seed template for assigning initial admin and rider roles
--              in Supabase STAGING environment.
--
-- INSTRUCTIONS:
-- 1. Create your admin user in Supabase Dashboard -> Authentication -> Users.
-- 2. Replace 'REPLACE_WITH_ADMIN_EMAIL' below with your actual admin email.
-- 3. Run this script in the Supabase SQL Editor.
-- =====================================================================

BEGIN;

-- ---------------------------------------------------------------------
-- 1. Assign ADMIN Role
-- ---------------------------------------------------------------------
DO $$
DECLARE
  v_admin_email text := 'REPLACE_WITH_ADMIN_EMAIL'; -- e.g. admin@sriamman.com
  v_user_id uuid;
BEGIN
  -- Look up user ID from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_admin_email;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'User with email % was not found in auth.users. Please create the user first in Dashboard -> Authentication -> Users.', v_admin_email;
  ELSE
    -- Upsert admin role into user_roles
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_user_id, 'admin')
    ON CONFLICT (user_id) DO UPDATE SET role = 'admin';

    RAISE NOTICE 'Successfully granted admin role to user: % (UUID: %)', v_admin_email, v_user_id;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Template: Provision a RIDER User & Profile
-- ---------------------------------------------------------------------
-- Riders sign in via Supabase Auth using synthetic email:
--   <username>@riders.grocery.invalid
-- Example: muthukumar@riders.grocery.invalid
DO $$
DECLARE
  v_rider_username text := 'REPLACE_WITH_RIDER_USERNAME'; -- e.g. muthukumar (lowercase)
  v_rider_phone    text := 'REPLACE_WITH_RIDER_PHONE';    -- e.g. 9842198421
  v_rider_name     text := 'REPLACE_WITH_RIDER_NAME';     -- e.g. Muthu Kumar
  v_synthetic_email text;
  v_rider_user_id  uuid;
BEGIN
  v_synthetic_email := lower(v_rider_username) || '@riders.grocery.invalid';

  -- Lookup auth user
  SELECT id INTO v_rider_user_id
  FROM auth.users
  WHERE email = v_synthetic_email;

  IF v_rider_user_id IS NULL THEN
    RAISE NOTICE 'Rider auth user % not found. Create user with email "%" first in Auth.', v_rider_username, v_synthetic_email;
  ELSE
    -- 1. Assign rider role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (v_rider_user_id, 'rider')
    ON CONFLICT (user_id) DO UPDATE SET role = 'rider';

    -- 2. Create or link rider profile
    INSERT INTO public.riders (user_id, username, full_name, phone, is_active)
    VALUES (v_rider_user_id, lower(v_rider_username), v_rider_name, v_rider_phone, true)
    ON CONFLICT (user_id) DO UPDATE SET
      username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      phone = EXCLUDED.phone,
      is_active = true;

    RAISE NOTICE 'Successfully configured rider % (UUID: %)', v_rider_username, v_rider_user_id;
  END IF;
END $$;

COMMIT;
