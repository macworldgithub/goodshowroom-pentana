import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('gs_session')?.value;
  const isLogin = request.nextUrl.pathname === '/login';
  const workspaceRoutes = [
    '/dashboard',
    '/leads',
    '/customers',
    '/pipeline',
    '/stock',
    '/deliveries',
    '/service',
    '/imports',
    '/reports',
    '/settings',
    '/sync',
    '/invitations',
  ];
  const isWorkspace = workspaceRoutes.some((route) => request.nextUrl.pathname.startsWith(route));

  if (!token && isWorkspace) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (token && isLogin) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/leads/:path*',
    '/customers/:path*',
    '/pipeline/:path*',
    '/stock/:path*',
    '/deliveries/:path*',
    '/service/:path*',
    '/imports/:path*',
    '/reports/:path*',
    '/settings/:path*',
    '/sync/:path*',
    '/invitations/:path*',
    '/login',
    '/auth/:path*',
  ],
};
