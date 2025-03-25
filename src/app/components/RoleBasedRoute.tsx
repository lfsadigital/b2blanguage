import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
}

const RoleBasedRoute = ({ children }: RoleBasedRouteProps) => {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const initialLoadComplete = useRef(false);
  const redirectAttempted = useRef(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      // Debug logging with styled console logs - removed console.clear() that was causing CORS errors
      console.log('%c🔐 B2B AUTH CHECK 🔐', 'background: #222; color: #bada55; font-size: 20px; padding: 10px;');
      console.log('%cCurrent Auth State:', 'color: #ff6b6b; font-weight: bold; font-size: 16px');
      console.log({
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

      // Now check authorization
      const allowedRoles = ['Teacher', 'Owner', 'Manager'];
      const authorized = !!user && allowedRoles.includes(userProfile);

      console.log('%cAuthorization Check:', 'color: #ff6b6b; font-weight: bold; font-size: 16px');
      console.log({
        authorized,
        userProfile,
        allowedRoles: allowedRoles.join(', ')
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
  }, [user, loading, userProfile, router]);

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

  // If not authorized, render nothing (redirect will happen)
  if (!isAuthorized) {
    return null;
  }

  // If authorized, render children
  return <>{children}</>;
};

export default RoleBasedRoute; 