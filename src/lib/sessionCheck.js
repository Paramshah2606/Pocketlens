import dbConnect from '@/lib/db';
import User from '@/models/User';

// Decides whether a valid-looking JWT should still be honoured: the account must exist
// and the token must have been issued after the last password change (so resetting a
// password signs out every other device). Results are cached briefly per server
// instance to avoid a database round trip on every request.

const CACHE_TTL_MS = 60 * 1000;
const MAX_ENTRIES = 5000;
// Kept on globalThis: the proxy and the API routes are bundled separately, so a plain
// module-level Map would give each its own copy and a password reset in a route
// couldn't clear the proxy's entry.
const cache = (globalThis.__pocketlensSessionCache ??= new Map()); // userId -> { exists, changedAt, at }

async function loadState(userId) {
  const hit = cache.get(userId);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit;

  await dbConnect();
  const user = await User.findById(userId).select('passwordChangedAt').lean();
  const state = { exists: Boolean(user), changedAt: user?.passwordChangedAt?.getTime() || 0, at: Date.now() };
  if (cache.size >= MAX_ENTRIES) cache.clear();
  cache.set(userId, state);
  return state;
}

// session: { userId, iat } from the verified JWT (iat in seconds)
export async function isSessionRevoked(session) {
  try {
    const state = await loadState(session.userId);
    if (!state.exists) return true;
    return Math.floor(state.changedAt / 1000) > (session.iat || 0);
  } catch (error) {
    // If the database is unreachable, don't lock everyone out; API routes will fail on their own
    console.error('Session check failed:', error);
    return false;
  }
}

// Call after changing a user's password so this instance stops trusting old tokens at once
export function forgetSessionState(userId) {
  cache.delete(String(userId));
}
