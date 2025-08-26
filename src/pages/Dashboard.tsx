import { Suspense } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { rolePanels, UserRole } from '@/config/rolePanels';

const Dashboard = () => {
  const { user, session, loading } = useAuth();

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

  const userRole = (session.user?.app_metadata?.role?.toLowerCase() || 'public') as UserRole;
  const PanelComponent = rolePanels[userRole];

  if (!PanelComponent) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
          <p className="text-muted-foreground">Panel not found for role: {userRole}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<div className="animate-pulse">Loading...</div>}>
        <PanelComponent />
      </Suspense>
    </div>
  );
};

export default Dashboard;