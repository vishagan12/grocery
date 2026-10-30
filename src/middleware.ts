import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function middleware(req: NextRequest) {
  let res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const pathname = req.nextUrl.pathname;

  // Only protect /admin and /rider page routes in middleware
  const isAdminPage = pathname.startsWith('/admin') && !pathname.startsWith('/admin/login');
  const isRiderPage = pathname.startsWith('/rider') && !pathname.startsWith('/rider/login');

  if (!isAdminPage && !isRiderPage) {
    return res;
  }

  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseUrl = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/+$/, '');
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return req.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        req.cookies.set({ name, value, ...options });
        res = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        res.cookies.set({ name, value, ...options });
      },
      remove(name: string, options) {
        req.cookies.set({ name, value: '', ...options });
        res = NextResponse.next({
          request: {
            headers: req.headers,
          },
        });
        res.cookies.set({ name, value: '', ...options });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();

  if (isAdminPage) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleRow?.role !== 'admin') {
      const url = req.nextUrl.clone();
      url.pathname = '/admin/login';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  if (isRiderPage) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = '/rider/login';
      return NextResponse.redirect(url);
    }

    const { data: roleRow } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (roleRow?.role !== 'rider') {
      const url = req.nextUrl.clone();
      url.pathname = '/rider/login';
      url.searchParams.set('error', 'unauthorized');
      return NextResponse.redirect(url);
    }
  }

  return res;
}

export const config = {
  matcher: ['/admin/:path*', '/rider/:path*'],
};
