import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import * as jose from 'jose';

const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY);
const sessionCookieName = 'nextads_session';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow requests for API routes, static files, and the login page to pass through
  if (pathname.startsWith('/api') || 
      pathname.startsWith('/_next') || 
      pathname.startsWith('/static') || 
      pathname.includes('.') || 
      pathname === '/login') {
    return NextResponse.next();
  }

  const sessionToken = req.cookies.get(sessionCookieName)?.value;

  if (!sessionToken) {
    // Redirect to login if no token
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verify the token
    await jose.jwtVerify(sessionToken, secret);
    // If token is valid, allow the request to proceed
    return NextResponse.next();
  } catch (err) {
    // If token is invalid, redirect to login
    console.error('JWT verification failed:', err);
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('redirect', pathname);
    
    // Create a response to redirect and delete the invalid cookie
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete(sessionCookieName);
    return response;
  }
}

// Define the paths that the middleware should apply to.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login).*)',
  ],
};
