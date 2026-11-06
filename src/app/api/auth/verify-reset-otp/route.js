import { NextResponse } from 'next/server';
import crypto from 'crypto';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { checkOtp } from '@/lib/otp';
import { normalizeEmail, EMAIL_COLLATION } from '@/lib/validate';

// Exchanges a valid reset code for a short-lived reset token
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);

    if (!email || typeof body.otp !== 'string') {
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
    }

    const user = await User.findOne({ email }).collation(EMAIL_COLLATION);
    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const result = await checkOtp(user, body.otp);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    await user.save();

    return NextResponse.json({ message: 'Code verified', resetToken }, { status: 200 });

  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
