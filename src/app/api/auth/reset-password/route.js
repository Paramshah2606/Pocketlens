import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req) {
  try {
    await dbConnect();
    const { userId, resetToken, newPassword } = await req.json();

    if (!userId || !resetToken || !newPassword) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const user = await User.findById(userId);
    console.log("Reset attempt for user:", userId);
    console.log("Received token:", resetToken);
    console.log("Stored token:", user?.resetToken);

    if (!user || user.resetToken !== resetToken) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    if (new Date() > new Date(user.resetTokenExpiry)) {
      return NextResponse.json({ error: 'Reset token has expired' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    await user.save();

    return NextResponse.json({ message: 'Password reset successfully' }, { status: 200 });

  } catch (error) {
    console.error('Reset password error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
