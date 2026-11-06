import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { sendOTP } from '@/lib/mailer';
import { issueOtp, resendWaitSeconds } from '@/lib/otp';
import { normalizeEmail, EMAIL_COLLATION } from '@/lib/validate';

// Starts a password reset. Always answers the same way so it can't be used to discover
// which emails have accounts; a code is only emailed when the account exists.
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    if (!email) {
      return NextResponse.json({ error: 'Please enter a valid email' }, { status: 400 });
    }

    const generic = { message: 'If an account exists for this email, we sent a reset code.', email };

    const user = await User.findOne({ email }).collation(EMAIL_COLLATION);
    if (user && resendWaitSeconds(user) === 0) {
      const otp = issueOtp(user);
      await user.save();
      const sent = await sendOTP(user.email, otp);
      if (!sent) console.error('Forgot password: failed to send reset email');
    }

    return NextResponse.json(generic, { status: 200 });

  } catch (error) {
    console.error('Forgot password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
