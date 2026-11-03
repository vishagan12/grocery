import { createBrowserClient } from '@supabase/ssr';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Clean base URL by stripping trailing /rest/v1/ or slashes
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

if (!supabaseUrl || !supabaseAnonKey) {
  if (typeof window !== 'undefined') {
    console.warn('Missing or invalid Supabase Environment Variables. Check your .env.local file.');
  }
}

/**
 * Shared browser Supabase client utilizing @supabase/ssr.
 * Persists session tokens in cookies so Next.js Middleware and Server Actions/Route Handlers
 * receive authentication cookies seamlessly.
 */
export const supabase = createBrowserClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export function createClient() {
  return supabase;
}
