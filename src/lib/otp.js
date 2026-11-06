import crypto from 'crypto';

// One-time codes for email verification and password reset.
export const OTP_TTL_MS = 10 * 60 * 1000; // code valid for 10 minutes
export const OTP_MAX_ATTEMPTS = 5; // wrong guesses allowed before the code is burned
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000; // at most one email per minute per account

export function generateOtp() {
  // crypto.randomInt is unpredictable, unlike Math.random
  return crypto.randomInt(100000, 1000000).toString();
}

// Seconds the user must wait before another code can be emailed (0 = can send now)
export function resendWaitSeconds(user) {
  if (!user.otpSentAt) return 0;
  const wait = user.otpSentAt.getTime() + OTP_RESEND_COOLDOWN_MS - Date.now();
  return wait > 0 ? Math.ceil(wait / 1000) : 0;
}

// Puts a fresh code on the user document (caller saves and emails it)
export function issueOtp(user) {
  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + OTP_TTL_MS);
  user.otpAttempts = 0;
  user.otpSentAt = new Date();
  return otp;
}

function clearOtp(user) {
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpAttempts = 0;
}

function safeEqual(a, b) {
  const ab = Buffer.from(String(a));
  const bb = Buffer.from(String(b));
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb);
}

// Checks a submitted code. Wrong guesses are counted and the code is destroyed after
// OTP_MAX_ATTEMPTS, so a 6-digit code can't be brute-forced. Saves the user.
// Returns { ok: true } or { ok: false, error, status }.
export async function checkOtp(user, submitted) {
  if (!user.otp || !user.otpExpiry) {
    return { ok: false, status: 400, error: 'No active code. Please request a new one.' };
  }
  if (Date.now() > user.otpExpiry.getTime()) {
    clearOtp(user);
    await user.save();
    return { ok: false, status: 400, error: 'This code has expired. Please request a new one.' };
  }
  if (typeof submitted !== 'string' || !safeEqual(submitted.trim(), user.otp)) {
    user.otpAttempts = (user.otpAttempts || 0) + 1;
    const left = OTP_MAX_ATTEMPTS - user.otpAttempts;
    if (left <= 0) {
      clearOtp(user);
      await user.save();
      return { ok: false, status: 429, error: 'Too many wrong attempts. Please request a new code.' };
    }
    await user.save();
    return { ok: false, status: 400, error: `Invalid code. ${left} attempt${left === 1 ? '' : 's'} left.` };
  }
  clearOtp(user);
  return { ok: true };
}

export function safeTokenEqual(a, b) {
  return typeof a === 'string' && typeof b === 'string' && safeEqual(a, b);
}
