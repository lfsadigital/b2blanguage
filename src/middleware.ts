import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedPaths = ['/test-generator', '/class-diary'];
  const path = request.nextUrl.pathname;

  // Check if the current path is protected
  if (protectedPaths.some(pp => path.startsWith(pp))) {
    // Debug: Log all cookies
    console.log('All cookies:', request.cookies.getAll());
    
    // Try different possible Firebase cookie names
    const possibleCookies = [
      'firebase:authUser:[DEFAULT]',
      'firebaseToken',
      request.cookies.get('__session'),
      ...request.cookies.getAll()
        .filter(cookie => cookie.name.includes('firebase'))
        .map(cookie => cookie.value)
    ];
    
    console.log('Possible Firebase cookies:', possibleCookies);

    // Get Firebase session
    const firebaseSession = request.cookies.getAll()
      .find(cookie => cookie.name.includes('firebase:authUser'));
    
    console.log('Found Firebase session:', firebaseSession);
    
    // If no session exists, redirect to home page where auth flow will handle login
    if (!firebaseSession) {
      console.log('No Firebase session found, redirecting to home');
      return NextResponse.redirect(new URL('/', request.url));
    }

    // If we have a session, try to parse it
    try {
      const sessionData = JSON.parse(firebaseSession.value);
      console.log('Parsed session data:', {
        ...sessionData,
        // Remove sensitive data from logs
        stsTokenManager: sessionData.stsTokenManager ? 'REDACTED' : undefined
      });
      
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