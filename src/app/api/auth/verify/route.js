import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { startSession } from '@/lib/session';
import { checkOtp } from '@/lib/otp';
import { normalizeEmail, EMAIL_COLLATION } from '@/lib/validate';

// Verifies the signup email code and logs the user in
export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);

    if (!email || typeof body.otp !== 'string') {
      return NextResponse.json({ error: 'Missing email or code' }, { status: 400 });
    }

    const user = await User.findOne({ email }).collation(EMAIL_COLLATION);
    if (!user || user.isVerified) {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }

    const result = await checkOtp(user, body.otp);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    user.isVerified = true;
    await user.save();
    await startSession(user);

    return NextResponse.json({
      message: 'Email verified successfully',
      user: { id: user._id, name: user.name, email: user.email }
    }, { status: 200 });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
