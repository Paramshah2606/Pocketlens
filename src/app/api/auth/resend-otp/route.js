import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { sendOTP } from '@/lib/mailer';

export async function POST(req) {
  try {
    await dbConnect();
    const { userId, email } = await req.json();

    let query = {};
    if (userId) query._id = userId;
    else if (email) query.email = email;
    else return NextResponse.json({ error: 'UserId or Email is required' }, { status: 400 });

    const user = await User.findOne(query);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate new OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const emailSent = await sendOTP(user.email, otp);
    if (!emailSent) {
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ message: 'OTP resent successfully' }, { status: 200 });

  } catch (error) {
    console.error('Resend OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
