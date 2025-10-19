import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST() {
  // To log out, we just need to delete the session cookie.
  cookies().delete('nextads_session');
  return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
}
