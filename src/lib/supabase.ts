import { createClient } from '@supabase/supabase-js';

const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Clean the base URL by stripping trailing /rest/v1/ or slashes so supabase-js formats API requests properly
const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing or invalid Supabase Environment Variables. Check your .env.local file.');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);