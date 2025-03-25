import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedPaths = ['/test-generator', '/class-diary'];
  const path = request.nextUrl.pathname;

  // Check if the current path is protected
  if (protectedPaths.some(pp => path.startsWith(pp))) {
    // Get Firebase Auth token from cookies
    const token = request.cookies.get('__session');
    
    // If no token exists, redirect to home page where auth flow will handle login
    if (!token) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/test-generator/:path*', '/class-diary/:path*']
}; 