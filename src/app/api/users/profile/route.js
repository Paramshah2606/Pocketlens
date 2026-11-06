import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User, { PRIVATE_USER_FIELDS } from '@/models/User';
import { cleanString } from '@/lib/validate';

const THEMES = ['light', 'dark', 'system'];

export async function GET(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');

    const user = await User.findById(userId).select(PRIVATE_USER_FIELDS).lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ user }, { status: 200 });
  } catch (error) {
    console.error('Fetch profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req) {
  try {
    await dbConnect();
    const userId = req.headers.get('x-user-id');
    const body = await req.json().catch(() => ({}));

    const updateData = {};
    if (body.name !== undefined) {
      const name = cleanString(body.name, { max: 60 });
      if (!name) return NextResponse.json({ error: 'Name must be 1–60 characters' }, { status: 400 });
      updateData.name = name;
    }
    if (body.theme !== undefined) {
      if (!THEMES.includes(body.theme)) return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
      updateData.theme = body.theme;
    }
    if (body.currency !== undefined) {
      if (typeof body.currency !== 'string' || !/^[A-Z]{3}$/.test(body.currency)) {
        return NextResponse.json({ error: 'Invalid currency' }, { status: 400 });
      }
      updateData.currency = body.currency;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select(PRIVATE_USER_FIELDS).lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Profile updated successfully', user }, { status: 200 });
  } catch (error) {
    console.error('Update profile error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
