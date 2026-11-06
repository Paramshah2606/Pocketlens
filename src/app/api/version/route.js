import { NextResponse } from 'next/server';

// The version of the code currently deployed. Open apps compare it with the version they
// were loaded with (see src/components/UpdateNotifier.jsx) to offer a refresh.
export const dynamic = 'force-dynamic';

export function GET() {
  return NextResponse.json(
    { version: process.env.NEXT_PUBLIC_APP_VERSION || null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
