import { createServerClient, type SetAllCookies } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.next();
  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: ((cookiesToSet) => {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      }) satisfies SetAllCookies,
    },
  });
  const { data: { user } } = await supabase.auth.getUser();
  const isLogin = request.nextUrl.pathname === '/login';
  const workspaceRoutes = ['/dashboard', '/leads', '/customers', '/pipeline', '/stock', '/deliveries', '/service', '/imports', '/reports', '/settings'];
  const isWorkspace = workspaceRoutes.some((route) => request.nextUrl.pathname.startsWith(route));
  if (!user && isWorkspace) return NextResponse.redirect(new URL('/login', request.url));
  if (user && isLogin) return NextResponse.redirect(new URL('/dashboard', request.url));
  return response;
}

export const config = { matcher: ['/dashboard/:path*', '/leads/:path*', '/customers/:path*', '/pipeline/:path*', '/stock/:path*', '/deliveries/:path*', '/service/:path*', '/imports/:path*', '/reports/:path*', '/settings/:path*', '/login', '/auth/:path*'] };
