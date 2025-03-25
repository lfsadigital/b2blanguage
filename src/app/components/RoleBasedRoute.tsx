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
    // Only make authorization decision after loading is complete
    if (!loading) {
      console.log('Current user:', user?.email);
      console.log('User profile:', userProfile);
      const authorized = !!user && ['Teacher', 'Owner', 'Manager'].includes(userProfile);
      console.log('Is authorized:', authorized);
      setIsAuthorized(authorized);
      
      if (!authorized) {
        // Redirect to home page if not authorized
        console.log('Not authorized, redirecting to home');
        router.push('/');
      }
    }
  }, [user, loading, userProfile, router]);

  // Show loading state while checking authorization
  if (loading || isAuthorized === null) {
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