import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { safeTokenEqual } from '@/lib/otp';
import { forgetSessionState } from '@/lib/sessionCheck';
import { normalizeEmail, isValidPassword, EMAIL_COLLATION } from '@/lib/validate';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const { resetToken, newPassword } = body;

    if (!email || typeof resetToken !== 'string') {
      return NextResponse.json({ error: 'Your reset link is incomplete. Please start again.' }, { status: 400 });
    }
    if (!isValidPassword(newPassword)) {
      return NextResponse.json({ error: 'Password must be 8–128 characters' }, { status: 400 });
    }

    const user = await User.findOne({ email }).collation(EMAIL_COLLATION);
    if (!user || !user.resetToken || !safeTokenEqual(resetToken, user.resetToken)) {
      return NextResponse.json({ error: 'Invalid or expired reset session. Please start again.' }, { status: 400 });
    }
    if (!user.resetTokenExpiry || Date.now() > user.resetTokenExpiry.getTime()) {
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      await user.save();
      return NextResponse.json({ error: 'Your reset session has expired. Please start again.' }, { status: 400 });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    user.passwordChangedAt = new Date();
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    // A completed reset also proves ownership of the email
    user.isVerified = true;
    await user.save();
    // Tokens issued before passwordChangedAt are now rejected (signs out other devices)
    forgetSessionState(user._id);

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
