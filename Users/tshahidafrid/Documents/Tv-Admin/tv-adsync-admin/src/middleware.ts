import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAuth } from '@/lib/auth';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // These paths are publicly accessible and don't require authentication
  const publicPaths = ['/login', '/api/auth/login'];
  // These paths are for the TV player and should also be public
  const isTvPlayerPath = pathname.startsWith('/tv') || pathname.startsWith('/api/tv-state');
  
  if (publicPaths.includes(pathname) || isTvPlayerPath) {
    return NextResponse.next();
  }

  // Verify the token for all other paths
  const verifiedToken = await verifyAuth(request).catch((err) => {
    console.error(err.message)
    return null;
  });

  // If the token is not valid and the user is not trying to log in, redirect to login
  if (!verifiedToken) {
    // If the request is for an API endpoint, return a 401 Unauthorized response
    if (pathname.startsWith('/api/')) {
        return new NextResponse(
            JSON.stringify({ 'error': { message: 'Authentication Required' } }),
            { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
    }
    // For page requests, redirect to the login page
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If the user is authenticated and tries to access the login page, redirect them to the dashboard
  if (pathname === '/login' && verifiedToken) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  
  return NextResponse.next();
}

// Define which paths the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
