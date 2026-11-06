import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import { startSession } from '@/lib/session';
import { normalizeEmail, EMAIL_COLLATION } from '@/lib/validate';

const MAX_FAILED_LOGINS = 5;
const LOCK_MS = 15 * 60 * 1000;

// Compared against when the email is unknown, so response timing doesn't reveal which emails exist
const DUMMY_HASH = bcrypt.hashSync('pocketlens-timing-equaliser', 10);

export async function POST(req) {
  try {
    await dbConnect();
    const body = await req.json().catch(() => ({}));
    const email = normalizeEmail(body.email);
    const password = typeof body.password === 'string' ? body.password : null;

    if (!email || !password) {
      return NextResponse.json({ error: 'Please enter a valid email and password' }, { status: 400 });
    }

    const user = await User.findOne({ email }).collation(EMAIL_COLLATION);

    if (user?.lockUntil && user.lockUntil.getTime() > Date.now()) {
      const minutes = Math.ceil((user.lockUntil.getTime() - Date.now()) / 60000);
      return NextResponse.json({ error: `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.` }, { status: 429 });
    }

    const isMatch = await bcrypt.compare(password, user?.password || DUMMY_HASH);
    if (!user || !isMatch) {
      if (user) {
        user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
        if (user.failedLoginAttempts >= MAX_FAILED_LOGINS) {
          user.lockUntil = new Date(Date.now() + LOCK_MS);
          user.failedLoginAttempts = 0;
        }
        await user.save();
      }
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Only reveal verification status once the password is proven
    if (!user.isVerified) {
      return NextResponse.json({ error: 'Please verify your email first', isVerified: false, email: user.email }, { status: 403 });
    }

    if (user.failedLoginAttempts || user.lockUntil) {
      user.failedLoginAttempts = 0;
      user.lockUntil = undefined;
      await user.save();
    }

    await startSession(user);

    return NextResponse.json({
      message: 'Logged in successfully',
      user: { id: user._id, name: user.name, email: user.email, currency: user.currency, theme: user.theme }
    }, { status: 200 });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
