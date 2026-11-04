import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createServerClient } from '@supabase/ssr';
import { riderUsernameToSyntheticEmail } from '@/lib/serverAuth';
import {
  RATE_LIMITS,
  checkRateLimit,
  createRateLimitResponse,
  getClientIp,
  verifyBotProtection,
} from '@/lib/rateLimit';
import { logger, handleApiError } from '@/lib/logger';

const AuthActionSchema = z.object({
  action: z.enum([
    'login',
    'admin-login',
    'rider-login',
    'send-phone-otp',
    'verify-phone-otp',
    'google-login',
    'logout',
  ]),
  email: z.string().email().optional(),
  password: z.string().min(1).max(200).optional(),
  username: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),
  otp: z.string().max(10).optional(),
  name: z.string().max(100).optional(),
  dob: z.string().max(30).optional(),
  honeypot: z.string().optional(),
  formStartTime: z.number().optional(),
  scope: z.enum(['global', 'local', 'others']).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const rawBody = await req.json();
    const parsed = AuthActionSchema.safeParse(rawBody);
    if (!parsed.success) {
      const issueMsg = parsed.error.issues[0]?.message || 'Invalid auth payload format';
      return NextResponse.json({ error: issueMsg, issues: parsed.error.format() }, { status: 400 });
    }
    const body = parsed.data;
    const { action, email, password, username, phone, otp, name, dob, honeypot, formStartTime, scope } = body;

    // 0. Bot Protection for Login & OTP Actions
    const botCheck = verifyBotProtection({
      honeypot,
      formStartTime,
      minTimeMs: 400,
    });
    if (botCheck.isBot) {
      return NextResponse.json(
        { error: 'Automated request detected. Please try again.' },
        { status: 400 }
      );
    }

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

    // 1. Customer: Google OAuth URL initiation
    // Customers can sign in with Google now; Phone OTP remains available interchangeably
    if (action === 'google-login') {
      const origin = req.nextUrl.origin;
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${origin}/auth/callback?next=/`,
        },
      });

      if (error || !data.url) {
        return NextResponse.json({ error: error?.message || 'Failed to initiate Google sign in' }, { status: 400 });
      }

      return NextResponse.json({ url: data.url });
    }

    // 2. Customer: Send Phone OTP
    // Rate limit: 3 per 10 min per phone AND 10 per hour per IP
    if (action === 'send-phone-otp') {
      const cleanPhone = (phone || '').replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        return NextResponse.json({ error: 'Valid 10-digit phone number is required' }, { status: 400 });
      }

      const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
        ? `+${cleanPhone}` 
        : `+91${cleanPhone.slice(-10)}`;

      // IP limit check
      const rlIp = await checkRateLimit(RATE_LIMITS.OTP_SEND_IP, ip);
      if (!rlIp.success) {
        return createRateLimitResponse(rlIp.retryAfterSeconds, 'Too many OTP requests from this IP. Please wait.');
      }

      // Phone limit check
      const rlPhone = await checkRateLimit(RATE_LIMITS.OTP_SEND_PHONE, formattedPhone);
      if (!rlPhone.success) {
        return createRateLimitResponse(rlPhone.retryAfterSeconds, 'Too many OTP requests for this phone number. Please wait.');
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: formattedPhone,
      });

      if (error) {
        return NextResponse.json({ error: error.message || 'Failed to send OTP' }, { status: 400 });
      }

      return NextResponse.json({ success: true, message: 'OTP sent successfully' });
    }

    // 3. Customer: Verify Phone OTP
    // Rate limit: 5 per 10 min per phone
    if (action === 'verify-phone-otp') {
      const cleanPhone = (phone || '').replace(/\D/g, '');
      const cleanOtp = (otp || '').trim();

      if (cleanPhone.length < 10 || !cleanOtp) {
        return NextResponse.json({ error: 'Phone and OTP code are required' }, { status: 400 });
      }

      const formattedPhone = cleanPhone.startsWith('91') && cleanPhone.length === 12 
        ? `+${cleanPhone}` 
        : `+91${cleanPhone.slice(-10)}`;

      const rlVerify = await checkRateLimit(RATE_LIMITS.OTP_VERIFY_PHONE, formattedPhone);
      if (!rlVerify.success) {
        return createRateLimitResponse(rlVerify.retryAfterSeconds, 'Too many OTP verification attempts. Please wait.');
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone: formattedPhone,
        token: cleanOtp,
        type: 'sms',
      });

      if (error || !data.user) {
        return NextResponse.json({ error: error?.message || 'Invalid or expired OTP' }, { status: 401 });
      }

      // Update customer profile metadata if provided
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

    // 4. Admin Login
    // Rate limit: 5 attempts per 15 min per IP + username, then 15 min lockout
    if (action === 'admin-login') {
      if (!email || !password) {
        return NextResponse.json({ error: 'Email and password required' }, { status: 400 });
      }

      const identifier = `${ip}:${email.trim().toLowerCase()}`;
      const rlLogin = await checkRateLimit(RATE_LIMITS.LOGIN, identifier);
      if (!rlLogin.success) {
        return createRateLimitResponse(rlLogin.retryAfterSeconds, 'Too many login attempts. Account locked for 15 minutes.');
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

    // 5. Rider Login
    // Rate limit: 5 attempts per 15 min per IP + username, then 15 min lockout
    if (action === 'rider-login') {
      if (!username || !password) {
        return NextResponse.json({ error: 'Username and password required' }, { status: 400 });
      }

      const identifier = `${ip}:${username.trim().toLowerCase()}`;
      const rlLogin = await checkRateLimit(RATE_LIMITS.LOGIN, identifier);
      if (!rlLogin.success) {
        return createRateLimitResponse(rlLogin.retryAfterSeconds, 'Too many login attempts. Account locked for 15 minutes.');
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

    // 6. Logout / Logout Everywhere
    if (action === 'logout') {
      if (scope === 'global' || scope === 'others') {
        await supabase.auth.signOut({ scope: scope as 'global' | 'others' });
      } else {
        await supabase.auth.signOut();
      }
      return res;
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: 'Authentication request failed' }, { status: 500 });
  }
}
