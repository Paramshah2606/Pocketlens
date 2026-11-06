import crypto from 'crypto';
import { NextResponse } from 'next/server';

// Maintenance endpoints (seed / migrations) change data for every user, so they are
// disabled unless ADMIN_SECRET is configured and sent in the `x-admin-secret` header.
// Returns a 404 response to send when access is denied, or null when allowed.
export function requireAdmin(req) {
  const secret = process.env.ADMIN_SECRET;
  const given = Buffer.from(req.headers.get('x-admin-secret') || '');
  const expected = Buffer.from(typeof secret === 'string' ? secret : '');
  const ok =
    expected.length >= 16 &&
    given.length === expected.length &&
    crypto.timingSafeEqual(given, expected);
  return ok ? null : NextResponse.json({ error: 'Not found' }, { status: 404 });
}
