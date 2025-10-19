import { jwtVerify } from 'jose';
import type { NextRequest } from 'next/server'

export const AUTH_COOKIE_NAME = 'auth_token';

/**
 * Returns the secret key for signing JWTs.
 * Throws an error if the secret key is not defined in environment variables.
 */
export function getJwtSecretKey(): Uint8Array {
  const secret = process.env.JWT_SECRET_KEY;
  if (!secret) {
    throw new Error('JWT_SECRET_KEY environment variable is not set!');
  }
  return new TextEncoder().encode(secret);
}

/**
 * Verifies the authentication token from the request cookies.
 * @param request The Next.js request object.
 * @returns The JWT payload if the token is valid, otherwise throws an error.
 */
export async function verifyAuth(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;

  if (!token) {
    throw new Error('Missing authentication token.');
  }

  try {
    const verified = await jwtVerify(token, getJwtSecretKey());
    return verified.payload;
  } catch (err) {
    throw new Error('Your token has expired or is invalid.');
  }
}
