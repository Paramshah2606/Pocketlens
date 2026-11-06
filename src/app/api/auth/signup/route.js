import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { sendOTP } from '@/lib/mailer';
import { issueOtp } from '@/lib/otp';
import { cleanString, normalizeEmail, isValidPassword, EMAIL_COLLATION } from '@/lib/validate';

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const name = cleanString(body.name, { max: 60 });
    const email = normalizeEmail(body.email);

    if (!name || !email) {
      return NextResponse.json({ error: 'Please enter your name and a valid email' }, { status: 400 });
    }
    if (!isValidPassword(body.password)) {
      return NextResponse.json({ error: 'Password must be 8–128 characters' }, { status: 400 });
    }

    const existingUser = await User.findOne({ email }).collation(EMAIL_COLLATION);
    if (existingUser) {
      return NextResponse.json({ error: 'An account with this email already exists. Try logging in.' }, { status: 409 });
    }

    const user = new User({
      name,
      email,
      password: await bcrypt.hash(body.password, 10),
    });
    const otp = issueOtp(user);
    await user.save();

    const emailSent = await sendOTP(email, otp);

    return NextResponse.json({
      message: emailSent ? 'Account created. We sent a code to your email.' : 'Account created, but we could not send the email. Use "Resend code".',
      email: user.email,
      emailSent,
    }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: 'An account with this email already exists. Try logging in.' }, { status: 409 });
    }
    console.error('Signup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
