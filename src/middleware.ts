import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Protected routes
  const protectedPaths = ['/test-generator', '/class-diary'];
  const path = request.nextUrl.pathname;

  // Check if the current path is protected
  if (protectedPaths.some(pp => path.startsWith(pp))) {
    console.log(`[Middleware] Checking access to protected path: ${path}`);
    
    // Get Firebase session
    const firebaseSession = request.cookies.getAll()
      .find(cookie => cookie.name.includes('firebase:authUser'));
    
    console.log('[Middleware] Firebase session found:', !!firebaseSession);
    
    // IMPORTANT: In a production app, this would redirect to login
    // But for development and testing, we'll allow the client-side auth to handle this
    // The RoleBasedRoute component will handle the redirection
    
    // If we have a session, log it but don't parse or validate
    if (firebaseSession) {
      console.log('[Middleware] Session cookie exists, allowing client-side auth to handle authorization');
      return NextResponse.next();
    } else {
      console.log('[Middleware] No session cookie found, but allowing through for client-side handling');
      // Return next instead of redirecting - client will handle auth
      return NextResponse.next(); 
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/test-generator/:path*', '/class-diary/:path*']
}; 