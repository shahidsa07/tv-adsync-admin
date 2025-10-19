import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { cookies } from 'next/headers';
import { AUTH_COOKIE_NAME, getJwtSecretKey } from '@/lib/auth';

export async function POST(request: Request) {
  const body = await request.json();
  const { username, password } = body;

  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminUsername || !adminPassword) {
    console.error('ADMIN_USERNAME or ADMIN_PASSWORD not set in .env file');
    return NextResponse.json(
      { message: 'Server configuration error.' },
      { status: 500 }
    );
  }

  if (username === adminUsername && password === adminPassword) {
    // User is authenticated
    const token = await new SignJWT({ username })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d') // Token expires in 1 day
      .sign(getJwtSecretKey());

    // Set the token in an HTTP-only cookie
    cookies().set(AUTH_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      maxAge: 60 * 60 * 24, // 1 day in seconds
    });

    return NextResponse.json({ message: 'Login successful' }, { status: 200 });
  }

  // Authentication failed
  return NextResponse.json(
    { message: 'Invalid username or password' },
    { status: 401 }
  );
}
