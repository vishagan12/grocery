-- =====================================================================
-- Migration: 20261028170200_create_riders_and_link_auth.sql
-- Description: Creates or enhances public.riders table, links orders
--              and addresses to auth.users, adds assigned_rider_id to orders,
--              and creates essential lookup indexes for RLS query performance.
-- =====================================================================

BEGIN;

-- 1. Create or ensure public.riders table
CREATE TABLE IF NOT EXISTS public.riders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE NOT NULL CHECK (username = lower(username)),
  full_name text NOT NULL,
  phone text NOT NULL,
  vehicle_info text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Defensive column additions in case public.riders pre-existed in staging
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS username text UNIQUE;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS vehicle_info text;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS created_at timestamptz NOT NULL DEFAULT now();
ALTER TABLE public.riders ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Ensure username constraint is lowercase
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_riders_username_lowercase'
  ) THEN
    ALTER TABLE public.riders ADD CONSTRAINT check_riders_username_lowercase CHECK (username = lower(username));
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- 2. Link public.orders to auth.users and public.riders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS assigned_rider_id uuid REFERENCES public.riders(id) ON DELETE SET NULL;

-- 3. Link public.addresses to auth.users
ALTER TABLE public.addresses ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- 4. Create performant indexes for foreign keys and RLS lookup columns
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_rider_id ON public.orders(assigned_rider_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON public.orders(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

CREATE INDEX IF NOT EXISTS idx_riders_user_id ON public.riders(user_id);
CREATE INDEX IF NOT EXISTS idx_riders_username ON public.riders(username);
CREATE INDEX IF NOT EXISTS idx_riders_is_active ON public.riders(is_active);

COMMIT;
