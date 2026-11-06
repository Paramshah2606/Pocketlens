import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { sendOTP } from '@/lib/mailer';
import { issueOtp, resendWaitSeconds } from '@/lib/otp';
import { normalizeEmail, EMAIL_COLLATION } from '@/lib/validate';

// Re-sends a verification / reset code. Rate limited to one email per minute per account,
// and gives the same answer whether or not the account exists.
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ error: 'A valid email is required' }, { status: 400 });
    }

    const generic = { message: 'If an account exists for this email, a new code has been sent.' };
    const user = await User.findOne({ email }).collation(EMAIL_COLLATION);
    if (!user) return NextResponse.json(generic, { status: 200 });

    const wait = resendWaitSeconds(user);
    if (wait > 0) {
      return NextResponse.json({ error: `Please wait ${wait}s before requesting another code.`, retryAfter: wait }, { status: 429 });
    }

    const otp = issueOtp(user);
    await user.save();
    const emailSent = await sendOTP(user.email, otp);
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send email. Please try again shortly.' }, { status: 502 });
    }

    return NextResponse.json(generic, { status: 200 });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
