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

  useEffect(() => {
    console.log('RoleBasedRoute effect running');
    console.log('Loading state:', loading);
    
    // Only make authorization decision after loading is complete
    if (!loading) {
      console.log('Auth state:', {
        userEmail: user?.email,
        userProfile,
        displayName: user?.displayName,
        isAuthenticated: !!user
      });
      
      const authorized = !!user && ['Teacher', 'Owner', 'Manager'].includes(userProfile);
      console.log('Authorization check:', {
        hasUser: !!user,
        userProfile,
        allowedRoles: ['Teacher', 'Owner', 'Manager'],
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
  }, [user, loading, userProfile, router]);

  // Show loading state while checking authorization
  if (loading || isAuthorized === null) {
    console.log('Showing loading state:', { loading, isAuthorized });
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