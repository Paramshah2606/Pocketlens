import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import crypto from 'crypto';

export async function POST(req) {
  try {
    await dbConnect();
    const { userId, otp } = await req.json();

    if (!userId || !otp) {
      return NextResponse.json({ error: 'Missing userId or OTP' }, { status: 400 });
    }

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.otp !== otp) {
      return NextResponse.json({ error: 'Invalid OTP' }, { status: 400 });
    }

    if (new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ error: 'OTP has expired' }, { status: 400 });
    }

    // Generate a reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    user.otp = undefined;
    user.otpExpiry = undefined;
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    await user.save();
    console.log("Generated reset token for user:", user._id, resetToken);

    return NextResponse.json({ 
      message: 'OTP verified successfully',
      resetToken
    }, { status: 200 });

  } catch (error) {
    console.error('Verify reset OTP error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
