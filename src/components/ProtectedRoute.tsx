// components/ProtectedRoute.tsx
import { useAuth } from '@/hooks/useAuth';
import { Navigate } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute = ({ children, requiredRoles }: ProtectedRouteProps) => {
  const { user, loading, session, role } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !session) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRoles?.length) {
    const allow = requiredRoles.map(r => r.toLowerCase()).includes((role ?? 'public').toLowerCase());
    if (!allow) return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
