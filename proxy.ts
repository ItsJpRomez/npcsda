import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_KEY, SUPABASE_URL, isSupabaseConfigured } from '@/lib/supabase/config';

/**
 * Runs before every /admin request: keeps the sign-in session fresh and sends
 * visitors who aren't signed in to the login page. The admin check itself
 * (is this user in admin_users?) happens in app/admin/(panel)/layout.tsx,
 * and Row Level Security in Supabase protects the data either way.
 */
export async function proxy(request: NextRequest) {
  if (!isSupabaseConfigured) return NextResponse.next();

  let response = NextResponse.next({ request });
  const sb = createServerClient(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (list) => {
        list.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        list.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const { data: { user } } = await sb.auth.getUser();

  const path = request.nextUrl.pathname;
  const isPublicAdminPage = path.startsWith('/admin/login') || path.startsWith('/admin/auth');
  if (!user && !isPublicAdminPage) {
    const login = request.nextUrl.clone();
    login.pathname = '/admin/login';
    login.search = '';
    return NextResponse.redirect(login);
  }
  return response;
}

export const config = {
  matcher: ['/admin/:path*'],
};
