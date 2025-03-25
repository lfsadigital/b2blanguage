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
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  useEffect(() => {
    const checkAuthorization = async () => {
      console.log('RoleBasedRoute effect running');
      console.log('Loading state:', loading);
      
      // Wait for the initial Firebase load
      if (loading) {
        console.log('Still loading Firebase auth...');
        return;
      }

      // Set initial load as complete
      if (!initialLoadComplete) {
        console.log('Initial Firebase load complete');
        setInitialLoadComplete(true);
      }
      
      console.log('Auth state:', {
        userEmail: user?.email,
        userProfile,
        displayName: user?.displayName,
        isAuthenticated: !!user
      });

      // Only proceed with authorization check after initial load
      if (initialLoadComplete) {
        // Check if user is authenticated
        if (!user) {
          console.log('No user found, redirecting to home');
          setIsAuthorized(false);
          router.push('/');
          return;
        }

        // Check if user has the correct profile type
        const allowedRoles = ['Teacher', 'Owner', 'Manager'];
        const authorized = allowedRoles.includes(userProfile);
        
        console.log('Authorization check:', {
          userProfile,
          allowedRoles,
          isAuthorized: authorized
        });
        
        setIsAuthorized(authorized);
        
        if (!authorized) {
          console.log('Not authorized, redirecting to home');
          router.push('/');
        } else {
          console.log('User is authorized, rendering protected content');
        }
      }
    };

    checkAuthorization();
  }, [user, loading, userProfile, router, initialLoadComplete]);

  // Show loading state while checking authorization or during initial load
  if (loading || !initialLoadComplete || isAuthorized === null) {
    console.log('Showing loading state:', { loading, initialLoadComplete, isAuthorized });
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If not authorized, render nothing (redirect will happen)
  if (!isAuthorized) {
    console.log('Not authorized, rendering null');
    return null;
  }

  // If authorized, render children
  console.log('Authorized, rendering children');
  return <>{children}</>;
};

export default RoleBasedRoute; 