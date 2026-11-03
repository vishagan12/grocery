import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { riderUsernameToSyntheticEmail } from '@/lib/serverAuth';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, email, password, username, phone, otp, name, dob } = body;

    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    let res = NextResponse.json({ success: true });

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            req.cookies.set(name, value);
          });
          res = NextResponse.json({ success: true });
          cookiesToSet.forEach(({ name, value, options }) => {
            res.cookies.set(name, value, options);
          });
        },
      },
    });

    // 1. Customer: Send Phone OTP
    if (action === 'send-phone-otp') {
      const cleanPhone = (phone || '').replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return NextResponse.json({ error: 'Valid 10-digit phone number is required' }, { status: 400 });
      }

      const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
        ? `+${cleanPhone}` 
        : `+91${cleanPhone.slice(-10)}`;

      const { data, error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    }

    // 2. Customer: Verify Phone OTP
    if (action === 'verify-phone-otp') {
      const cleanPhone = (phone || '').replace(/\D/g, '');
      const cleanOtp = (otp || '').trim();

      if (cleanPhone.length < 10 || !cleanOtp) {
        return NextResponse.json({ error: 'Phone and OTP code are required' }, { status: 400 });
      }

      const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
        ? `+${cleanPhone}` 
        : `+91${cleanPhone.slice(-10)}`;

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: cleanOtp,
        type: 'sms',
      });

      if (error || !data.user) {
        return NextResponse.json({ error: error.message || 'Invalid or expired OTP' }, { status: 401 });
      }

      // If name or dob was passed, update user metadata
      if (name || dob) {
        await supabase.auth.updateUser({
          data: {
            full_name: name || data.user.user_metadata?.full_name || '',
            dob: dob || data.user.user_metadata?.dob || '',
          },
        });
      }

      return NextResponse.json(
        {
          success: true,
          user: {
            id: data.user.id,
            phone: formattedPhone,
            name: name || data.user.user_metadata?.full_name || 'Customer',
            dob: dob || data.user.user_metadata?.dob || '',
          },
        },
        { headers: res.headers }
      );
    }

    // 3. Admin Login
    if (action === 'admin-login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error || !data.user) {
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

    // 4. Rider Login
    if (action === 'rider-login') {
      if (!username || !password) {
        return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
      }

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

      return NextResponse.json(
        {
          success: true,
          rider: {
            id: riderProfile.id,
            name: riderProfile.full_name,
            username: riderProfile.username,
            phone: riderProfile.phone,
          },
        },
        { headers: res.headers }
      );
    }

    // 5. Logout
    if (action === 'logout') {
      await supabase.auth.signOut();
      return res;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Authentication request failed' }, { status: 500 });
  }
}
