-- =====================================================================
-- Rollback: 20261028170100_rollback_roles_and_helpers.sql
-- Description: Reverses 20261028170100_create_roles_and_helpers.sql
-- =====================================================================

BEGIN;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_role();

DROP POLICY IF EXISTS user_roles_admin_delete ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_update ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_insert ON public.user_roles;
DROP POLICY IF EXISTS user_roles_admin_select ON public.user_roles;
DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;

DROP FUNCTION IF EXISTS public.is_rider();
DROP FUNCTION IF EXISTS public.is_admin();
DROP FUNCTION IF EXISTS public.app_role();

DROP TABLE IF EXISTS public.user_roles CASCADE;

COMMIT;
