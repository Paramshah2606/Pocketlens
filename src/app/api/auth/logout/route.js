import { NextResponse } from 'next/server';
import { endSession } from '@/lib/session';

export async function POST() {
  await endSession();
  return NextResponse.json({ message: 'Logged out successfully' }, { status: 200 });
}
