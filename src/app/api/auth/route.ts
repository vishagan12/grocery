import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { riderUsernameToSyntheticEmail } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, username } = body;

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    let res = NextResponse.json({ success: true });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options) {
          res.cookies.set({ name, value: '', ...options });
        },
      },
    });

    if (action === 'admin-login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
        // Return generic message to prevent account enumeration
        return NextResponse.json({ error: 'Invalid login credentials' }, { status: 401 });
      }

      // Verify admin role in database
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (roleRow?.role !== 'admin') {
        await supabase.auth.signOut();
        return NextResponse.json({ error: 'Access denied: Admin role required' }, { status: 403 });
      }

      return res;
    }

    if (action === 'rider-login') {
      if (!username || !password) {
        return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
      }

      // Convert username to synthetic email on server
      const syntheticEmail = riderUsernameToSyntheticEmail(username);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: syntheticEmail,
        password,
      });

      if (error || !data.user) {
        return NextResponse.json({ error: 'Invalid username or password' }, { status: 401 });
      }

      // Verify rider role and active profile
      const { data: roleRow } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (roleRow?.role !== 'rider') {
        await supabase.auth.signOut();
        return NextResponse.json({ error: 'Access denied: Rider role required' }, { status: 403 });
      }

      const { data: riderProfile } = await supabase
        .from('riders')
        .select('id, full_name, username, phone, is_active')
        .eq('user_id', data.user.id)
        .maybeSingle();

      if (!riderProfile?.is_active) {
        await supabase.auth.signOut();
        return NextResponse.json({ error: 'Rider account is deactivated. Contact store admin.' }, { status: 403 });
      }

      return NextResponse.json({
        success: true,
        rider: {
          id: riderProfile.id,
          name: riderProfile.full_name,
          username: riderProfile.username,
          phone: riderProfile.phone,
        },
      }, { headers: res.headers });
    }

    if (action === 'logout') {
      await supabase.auth.signOut();
      return res;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Authentication request failed' }, { status: 500 });
  }
}
