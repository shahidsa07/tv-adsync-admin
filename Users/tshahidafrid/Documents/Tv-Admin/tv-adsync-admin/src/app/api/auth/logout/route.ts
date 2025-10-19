import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME } from '@/lib/auth';

export async function POST(request: Request) {
  // To log out, we simply delete the authentication cookie.
  cookies().delete(AUTH_COOKIE_NAME);

  return NextResponse.json({ message: 'Logout successful' }, { status: 200 });
}
