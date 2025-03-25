import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

type UserProfileType = 'Visitor' | 'Owner' | 'Manager' | 'Teacher' | 'Student';

interface RoleBasedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserProfileType[];
}

const RoleBasedRoute = ({ children, requiredRoles }: RoleBasedRouteProps) => {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const initialLoadComplete = useRef(false);
  const redirectAttempted = useRef(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      // Debug logging with styled console logs
      console.log('%c🔐 B2B AUTH CHECK 🔐', 'background: #222; color: #bada55; font-size: 20px; padding: 10px;');
      console.log('%cCurrent Auth State:', 'color: #ff6b6b; font-weight: bold; font-size: 16px');
      console.log({
        path: pathname,
        loading,
        hasUser: !!user,
        email: user?.email || 'No email',
        userProfile,
        initialLoadComplete: initialLoadComplete.current,
        redirectAttempted: redirectAttempted.current
      });

      // Don't proceed while loading - wait for auth to settle
      if (loading) {
        console.log('%c⌛ Still loading auth state...', 'color: #4ecdc4; font-size: 14px');
        return;
      }

      // FIXED: Wait for the user profile to stabilize
      // This handles the transition from Visitor to Teacher
      // We need to wait for the profile to be fully loaded before making decisions
      if (user && userProfile === 'Visitor') {
        console.log('%c⏳ User found but profile still shows Visitor - waiting for profile update...', 'color: #f7d794; font-size: 14px');
        return; // Exit and wait for the next render when userProfile is updated
      }

      // Now that we have stable auth state, mark initial load complete
      if (!initialLoadComplete.current) {
        console.log('%c✅ Initial load complete', 'color: #2ecc71; font-size: 14px');
        initialLoadComplete.current = true;
      }

      // Determine which roles are allowed for the current page
      let currentPageRoles: UserProfileType[] = requiredRoles || [];
      
      // If no specific roles were provided, use path-based defaults
      if (!requiredRoles) {
        if (pathname?.includes('/database')) {
          // Database page: Only Owners and Managers should have access
          currentPageRoles = ['Owner', 'Manager'];
          console.log('%c📊 Database page - restricted to Owners and Managers', 'color: #a29bfe; font-size: 14px');
        } 
        else if (pathname?.includes('/test-generator') || pathname?.includes('/class-diary')) {
          // Test Generator and Class Diary: Owners, Managers and Teachers
          currentPageRoles = ['Owner', 'Manager', 'Teacher'];
          console.log('%c📝 Test Generator/Class Diary - access for Owners, Managers, Teachers', 'color: #a29bfe; font-size: 14px');
        }
        else {
          // Default: Allow all authenticated users with a valid role
          currentPageRoles = ['Owner', 'Manager', 'Teacher', 'Student'];
          console.log('%c🔓 Other page - using default access control', 'color: #a29bfe; font-size: 14px');
        }
      }

      // Check if the current user's profile is in the allowed roles
      const authorized = !!user && currentPageRoles.includes(userProfile as UserProfileType);

      console.log('%cAuthorization Check:', 'color: #ff6b6b; font-weight: bold; font-size: 16px');
      console.log({
        authorized,
        userProfile,
        currentPageRoles: currentPageRoles.join(', ')
      });

      setIsAuthorized(authorized);

      // Only redirect if:
      // 1. Initial load is complete 
      // 2. We haven't tried redirecting before
      // 3. User is definitely not authorized
      // 4. User is not a visitor (which means still loading)
      if (initialLoadComplete.current && !redirectAttempted.current && !authorized && userProfile !== 'Visitor') {
        console.log('%c🚫 Redirecting to home - unauthorized access', 'color: #ff4757; font-size: 16px; font-weight: bold');
        redirectAttempted.current = true;
        router.push('/');
      }
    };

    checkAuthorization();
  }, [user, loading, userProfile, router, pathname, requiredRoles]);

  // Show loading state during initial load
  if (loading || (user && userProfile === 'Visitor') || !initialLoadComplete.current || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <div className="ml-3 text-gray-600">
          {loading ? 'Loading auth state...' : 
           (user && userProfile === 'Visitor') ? 'Finalizing profile...' : 
           'Verifying access...'}
        </div>
      </div>
    );
  }

  // If not authorized, display access restricted message
  if (!isAuthorized) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <div className="text-red-500 mb-6">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Access Restricted</h2>
        <p className="text-gray-600 mb-6 max-w-md">
          {pathname?.includes('/database')
            ? "The Database page is only available to Owners and Managers."
            : pathname?.includes('/test-generator')
            ? "The Test Generator is only available to Teachers, Managers, and Owners."
            : pathname?.includes('/class-diary')
            ? "The Class Diary is only available to Teachers, Managers, and Owners."
            : "You don't have permission to access this page."
          }
          {" "}Please contact your administrator if you need access.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-4 py-2 bg-[#8B4513] text-white rounded-md hover:bg-[#A0522D] transition-colors"
        >
          Go to Home
        </button>
      </div>
    );
  }

  // If authorized, render children
  return <>{children}</>;
};

export default RoleBasedRoute; 