import { cookies } from 'next/headers';
import { signToken } from '@/lib/jwt';

const SEVEN_DAYS = 7 * 24 * 60 * 60;

// Sets the auth cookie (httpOnly JWT) plus a readable "logged_in" hint cookie that
// lets public pages show "Open app" instead of "Log in" without a server round trip.
// The hint carries no identity and grants nothing; all checks use the JWT.
export async function startSession(user) {
  const token = signToken({ userId: user._id.toString() });
  const cookieStore = await cookies();
  const secure = process.env.NODE_ENV === 'production';
  cookieStore.set('token', token, { httpOnly: true, secure, sameSite: 'strict', maxAge: SEVEN_DAYS, path: '/' });
  cookieStore.set('logged_in', '1', { httpOnly: false, secure, sameSite: 'lax', maxAge: SEVEN_DAYS, path: '/' });
}

export async function endSession() {
  const cookieStore = await cookies();
  cookieStore.delete('token');
  cookieStore.delete('logged_in');
}
