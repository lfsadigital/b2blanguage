import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface RoleBasedRouteProps {
  children: React.ReactNode;
}

const RoleBasedRoute = ({ children }: RoleBasedRouteProps) => {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !['Teacher', 'Owner', 'Manager'].includes(user.role))) {
      router.push('/');
    }
  }, [user, loading, router]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>;
  }

  if (!user || !['Teacher', 'Owner', 'Manager'].includes(user.role)) {
    return null;
  }

  return <>{children}</>;
};

export default RoleBasedRoute; 