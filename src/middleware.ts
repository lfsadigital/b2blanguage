import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedPaths = ['/test-generator', '/class-diary'];
  const path = request.nextUrl.pathname;

  // Check if the current path is protected
  if (protectedPaths.some(pp => path.startsWith(pp))) {
    // Get all cookies that might contain Firebase session
    const firebaseSession = request.cookies.get('firebase:authUser:[DEFAULT]');
    
    // If no session exists, redirect to home page where auth flow will handle login
    if (!firebaseSession) {
      console.log('No Firebase session found, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    // If we have a session, try to parse it
    try {
      const sessionData = JSON.parse(firebaseSession.value);
      if (!sessionData) {
        console.log('Invalid session data, redirecting to home');
        return NextResponse.redirect(new URL('/', request.url));
      }
      
      // Session exists and is valid, allow the request
      console.log('Valid session found, allowing request');
      return NextResponse.next();
    } catch (error) {
      console.log('Error parsing session data:', error);
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/test-generator/:path*', '/class-diary/:path*']
}; 