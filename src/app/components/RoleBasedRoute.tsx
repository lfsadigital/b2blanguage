import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
}

const RoleBasedRoute = ({ children }: RoleBasedRouteProps) => {
  const { user, loading, userProfile } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [hasCheckedOnce, setHasCheckedOnce] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      console.log('Auth State Check:', {
        loading,
        hasUser: !!user,
        userProfile,
        hasCheckedOnce
      });

      // Skip if still loading
      if (loading) {
        console.log('Still loading auth state...');
        return;
      }

      // If we have a user and profile is still Visitor, wait for potential update
      if (user && userProfile === 'Visitor' && !hasCheckedOnce) {
        console.log('User exists but profile is Visitor, waiting for potential update...');
        return;
      }

      // Mark that we've done at least one check
      if (!hasCheckedOnce) {
        setHasCheckedOnce(true);
      }

      // Now check authorization
      const allowedRoles = ['Teacher', 'Owner', 'Manager'];
      const authorized = !!user && allowedRoles.includes(userProfile);

      console.log('Final Authorization Check:', {
        hasUser: !!user,
        userProfile,
        isAuthorized: authorized
      });

      setIsAuthorized(authorized);

      // Only redirect if we're sure the user is not authorized
      if (!authorized && hasCheckedOnce) {
        console.log('User is not authorized, redirecting to home');
        router.push('/');
      }
    };

    checkAuthorization();
  }, [user, loading, userProfile, router, hasCheckedOnce]);

  // Show loading state while checking authorization
  if (loading || !hasCheckedOnce || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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