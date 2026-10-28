-- =====================================================================
-- Migration: 20261028170100_create_roles_and_helpers.sql
-- Description: Creates user_roles table, role helper functions,
--              RLS policies, and default customer role trigger on auth.users.
-- =====================================================================

BEGIN;

-- 1. Create public.user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'rider', 'customer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index user_id and role for rapid lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- 2. Enable RLS immediately
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3. Create role check helper functions (STABLE, SECURITY DEFINER, search_path = '')
CREATE OR REPLACE FUNCTION public.app_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT role FROM public.user_roles WHERE user_id = (SELECT auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (SELECT auth.uid()) 
      AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_rider()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = (SELECT auth.uid()) 
      AND role = 'rider'
  );
$$;

-- Revoke execute from public and anon, grant only to authenticated
REVOKE ALL ON FUNCTION public.app_role() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_rider() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.app_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_rider() TO authenticated;

-- 4. RLS Policies on public.user_roles
-- Authenticated users may select only their own role row
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Admins may select all roles
DROP POLICY IF EXISTS user_roles_admin_select ON public.user_roles;
CREATE POLICY user_roles_admin_select
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING ((SELECT public.is_admin()));

-- Admins may insert, update, delete roles (service role also bypasses RLS)
DROP POLICY IF EXISTS user_roles_admin_insert ON public.user_roles;
CREATE POLICY user_roles_admin_insert
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS user_roles_admin_update ON public.user_roles;
CREATE POLICY user_roles_admin_update
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS user_roles_admin_delete ON public.user_roles;
CREATE POLICY user_roles_admin_delete
  ON public.user_roles
  FOR DELETE
  TO authenticated
  USING ((SELECT public.is_admin()));

-- 5. Trigger on auth.users to assign 'customer' role by default
CREATE OR REPLACE FUNCTION public.handle_new_user_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_role();

COMMIT;
