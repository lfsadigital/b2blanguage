import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Get the user's session from the cookie
  const session = request.cookies.get('session');

  // Protected routes
  const protectedPaths = ['/test-generator', '/class-diary'];
  const path = request.nextUrl.pathname;

  // Check if the current path is protected
  if (protectedPaths.some(pp => path.startsWith(pp))) {
    // If no session exists, redirect to login
    if (!session) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // The role check will be handled by the RoleBasedRoute component
    // This is because we can't access Firebase Auth in middleware
    // The component will handle redirecting unauthorized users
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/test-generator/:path*', '/class-diary/:path*']
}; 