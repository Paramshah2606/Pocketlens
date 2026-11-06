import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { isSessionRevoked } from '@/lib/sessionCheck';

// Next.js 16 "proxy" (formerly middleware). Runs on the Node.js runtime.
// Verifies the auth cookie and passes the user id to API routes in the `x-user-id`
// header, which routes trust — so any client-supplied `x-user-id` is always removed.

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET);

// Login/signup flow: logged-in users are sent to the dashboard instead
const AUTH_PAGES = ['/login', '/signup', '/verify', '/forgot-password', '/reset-password'];

// Marketing/info pages: open to everyone, logged in or not
const PUBLIC_PAGES = ['/', '/about', '/features', '/how-it-works', '/privacy', '/terms', '/help', '/contact', '/pricing'];

// Metadata & PWA files: must load for everyone (the manifest and service worker too)
const PUBLIC_FILES = ['/sitemap.xml', '/robots.txt', '/manifest.webmanifest', '/sw.js', '/icon', '/apple-icon', '/opengraph-image'];

function isPublicApi(pathname) {
  return (
    pathname.startsWith('/api/auth/') ||
    pathname === '/api/contact' ||
    pathname === '/api/version' ||
    // Maintenance endpoints authenticate with ADMIN_SECRET themselves (see src/lib/admin.js)
    pathname === '/api/seed' ||
    pathname === '/api/migrate-categories' ||
    pathname === '/api/cleanup-categories'
  );
}

async function readSession(token) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { algorithms: ['HS256'] });
    const userId = typeof payload.userId === 'string' ? payload.userId : null;
    if (!userId || !/^[a-f\d]{24}$/i.test(userId)) return null;
    return { userId, iat: payload.iat };
  } catch {
    return null;
  }
}

function clearSessionCookies(response) {
  response.cookies.delete('token');
  response.cookies.delete('logged_in');
  return response;
}

export async function proxy(req) {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith('/api/');

  const headers = new Headers(req.headers);
  headers.delete('x-user-id');
  const pass = () => NextResponse.next({ request: { headers } });

  const token = req.cookies.get('token')?.value;
  let session = await readSession(token);
  if (session && (await isSessionRevoked(session))) session = null;

  if (AUTH_PAGES.includes(pathname)) {
    // /app picks the home screen for the device (Add screen on phones, dashboard on desktop)
    if (session) return NextResponse.redirect(new URL('/app', req.url));
    return token ? clearSessionCookies(pass()) : pass();
  }

  if (PUBLIC_PAGES.includes(pathname) || PUBLIC_FILES.includes(pathname) || (isApi && isPublicApi(pathname))) {
    return pass();
  }

  if (!session) {
    const response = isApi
      ? NextResponse.json({ error: 'Your session has expired. Please log in again.' }, { status: 401 })
      : NextResponse.redirect(new URL('/login', req.url));
    return token ? clearSessionCookies(response) : response;
  }

  headers.set('x-user-id', session.userId);
  return pass();
}

export const config = {
  matcher: [
    // Pages: skip Next's static assets and image files served from public/
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
    // API: always checked, whatever the path looks like
    '/api/:path*',
  ],
};
