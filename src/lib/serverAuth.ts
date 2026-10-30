import { NextRequest, NextResponse } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export interface AuthContext {
  user: any;
  role: string | null;
  supabase: ReturnType<typeof createServerClient>;
}

/**
 * Creates a server-side Supabase client from request cookies with session verification.
 * Uses getUser() to cryptographically validate the JWT against Supabase Auth.
 */
export function createServerSupabaseClient(req: NextRequest) {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set() {
        // Handled in response middleware / handlers if refreshing
      },
      remove() {
        // Handled in response middleware / handlers if refreshing
      },
    },
  });
}

/**
 * Creates an admin Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Strictly server-only. Used solely where bypassing RLS is indispensable
 * (creating rider auth accounts, admin password resets, webhook replay logging).
 */
export function createServerAdminClient() {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured on the server');
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Verifies session and fetches caller's role from public.user_roles.
 */
export async function getVerifiedUserAndRole(req: NextRequest): Promise<{
  user: any | null;
  role: string | null;
  supabaseClient: ReturnType<typeof createServerClient>;
}> {
  const supabaseClient = createServerSupabaseClient(req);
  const { data: { user }, error } = await supabaseClient.auth.getUser();

  if (error || !user) {
    return { user: null, role: null, supabaseClient };
  }

  // Fetch verified role from public.user_roles
  const { data: roleRow } = await supabaseClient
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle();

  return {
    user,
    role: roleRow?.role || null,
    supabaseClient,
  };
}

/**
 * Route protection helper: Requires verified admin role.
 * Returns 401 if unauthenticated, 403 if not admin, or AuthContext on success.
 */
export async function requireAdmin(req: NextRequest): Promise<AuthContext | NextResponse> {
  const { user, role, supabaseClient } = await getVerifiedUserAndRole(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admin privilege required' }, { status: 403 });
  }

  return {
    user,
    role,
    supabase: supabaseClient,
  };
}

/**
 * Route protection helper: Requires verified rider role.
 * Returns 401 if unauthenticated, 403 if not rider, or AuthContext on success.
 */
export async function requireRider(req: NextRequest): Promise<(AuthContext & { riderProfile: any }) | NextResponse> {
  const { user, role, supabaseClient } = await getVerifiedUserAndRole(req);

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required' }, { status: 401 });
  }

  if (role !== 'rider') {
    return NextResponse.json({ error: 'Forbidden: Rider privilege required' }, { status: 403 });
  }

  // Fetch rider profile using verified user.id
  const { data: riderProfile, error: profileErr } = await supabaseClient
    .from('riders')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  if (profileErr || !riderProfile) {
    return NextResponse.json({ error: 'Forbidden: Rider profile not found' }, { status: 403 });
  }

  if (!riderProfile.is_active) {
    return NextResponse.json({ error: 'Forbidden: Rider account is deactivated' }, { status: 403 });
  }

  return {
    user,
    role,
    supabase: supabaseClient,
    riderProfile,
  };
}

/**
 * Helper to generate synthetic email for rider auth accounts.
 */
export function riderUsernameToSyntheticEmail(username: string): string {
  const cleanUsername = username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
  return `${cleanUsername}@riders.grocery.invalid`;
}
