import { NextRequest, NextResponse } from 'next/server';
import * as jose from 'jose';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET_KEY;

    if (!adminUsername || !adminPassword || !jwtSecret) {
      console.error('Authentication environment variables are not set.');
      return NextResponse.json({ message: 'Server configuration error.' }, { status: 500 });
    }

    if (username === adminUsername && password === adminPassword) {
      // Create a JWT
      const secret = new TextEncoder().encode(jwtSecret);
      const token = await new jose.SignJWT({ username, role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('24h')
        .sign(secret);

      // Set the JWT in a secure, HTTP-only cookie
      cookies().set('nextads_session', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/',
        maxAge: 60 * 60 * 24, // 24 hours
        sameSite: 'lax',
      });

      return NextResponse.json({ message: 'Login successful' }, { status: 200 });
    } else {
      return NextResponse.json({ message: 'Invalid username or password' }, { status: 401 });
    }
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ message: 'An internal error occurred.' }, { status: 500 });
  }
}
