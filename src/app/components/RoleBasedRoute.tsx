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
      // Clear console and add a prominent header
      console.clear();
      console.log('%c🔐 B2B AUTH CHECK 🔐', 'background: #222; color: #bada55; font-size: 20px; padding: 10px;');

      // Debug logging with styled console logs
      console.log('%cCurrent Auth State:', 'color: #ff6b6b; font-weight: bold; font-size: 16px');
      console.table({
        loading,
        hasUser: !!user,
        email: user?.email || 'No email',
        userProfile,
        initialLoadComplete: initialLoadComplete.current,
        redirectAttempted: redirectAttempted.current
      });

      // Don't do anything while loading
      if (loading) {
        console.log('%c⌛ Still loading auth state...', 'color: #4ecdc4; font-size: 14px');
        return;
      }

      // Wait for the initial profile load
      if (!initialLoadComplete.current) {
        if (user && userProfile === 'Visitor') {
          console.log('%c⏳ Initial load - waiting for profile update...', 'color: #f7d794; font-size: 14px');
          return;
        }
        console.log('%c✅ Initial load complete', 'color: #2ecc71; font-size: 14px');
        initialLoadComplete.current = true;
      }

      // Now check authorization
      const allowedRoles = ['Teacher', 'Owner', 'Manager'];
      const authorized = !!user && allowedRoles.includes(userProfile);

      console.log('%cAuthorization Check:', 'color: #ff6b6b; font-weight: bold; font-size: 16px');
      console.table({
        authorized,
        userProfile,
        allowedRoles: allowedRoles.join(', ')
      });

      setIsAuthorized(authorized);

      // Only redirect if:
      // 1. Initial load is complete
      // 2. We haven't tried redirecting before
      // 3. User is definitely not authorized
      if (initialLoadComplete.current && !redirectAttempted.current && !authorized) {
        console.log('%c🚫 Redirecting to home - unauthorized access', 'color: #ff4757; font-size: 16px; font-weight: bold');
        redirectAttempted.current = true;
        router.push('/');
      }
    };

    checkAuthorization();
  }, [user, loading, userProfile, router]);

  // Show loading state during initial load
  if (loading || !initialLoadComplete.current || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <div className="ml-3 text-gray-600">
          {loading ? 'Loading auth state...' : 'Verifying access...'}
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