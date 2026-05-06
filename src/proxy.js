import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// We use 'jose' instead of 'jsonwebtoken' because 'jsonwebtoken' uses Node.js crypto which is not available in the Edge Runtime
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

export async function proxy(req) {
  const token = req.cookies.get('token')?.value;
  const { pathname } = req.nextUrl;

  const publicPaths = [
    '/', 
    '/login', 
    '/signup', 
    '/verify', 
    '/forgot-password', 
    '/reset-password',
    '/about',
    '/features',
    '/how-it-works',
    '/privacy',
    '/terms',
    '/help',
    '/contact',
    '/pricing'
  ];
  const isAuthApi = pathname.startsWith('/api/auth') || pathname === '/api/contact';
  const isMigrateApi = pathname === '/api/migrate-categories' || pathname === '/api/cleanup-categories';
  const isPublicFile = pathname === '/sitemap.xml' || pathname === '/robots.txt';

  // Allow access to public paths and auth APIs without a token
  if (publicPaths.includes(pathname) || isAuthApi || isMigrateApi || isPublicFile) {
    if (token && publicPaths.includes(pathname) && pathname !== '/') {
      // If user has a valid token and tries to access login/signup, redirect to dashboard
      try {
        await jwtVerify(token, JWT_SECRET);
        return NextResponse.redirect(new URL('/dashboard', req.url));
      } catch (e) {
        // Token is invalid, let them proceed to login
      }
    }
    return NextResponse.next();
  }

  // Require token for all other paths (dashboard, settings, other apis)
  if (!token) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    
    // Pass user info via headers to the next handlers if needed
    const requestHeaders = new Headers(req.headers);
    requestHeaders.set('x-user-id', payload.userId);
    
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
  } catch (error) {
    if (pathname.startsWith('/api')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    // Token is invalid/expired, redirect to login and clear cookie
    const response = NextResponse.redirect(new URL('/login', req.url));
    response.cookies.delete('token');
    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (e.g. images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
