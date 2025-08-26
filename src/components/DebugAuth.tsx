import { useAuth } from '@/hooks/useAuth';

export default function DebugAuth() {
  const { loading, user, session } = useAuth();
  
  const userRole = session?.user?.app_metadata?.role?.toLowerCase() || 'none';
  
  return (
    <pre data-testid="debug-auth" className="p-2 text-xs bg-gray-100 rounded border mb-4">
      {JSON.stringify({ 
        loading, 
        hasUser: !!user, 
        uid: user?.id?.substring(0, 8) + '...' || null, 
        role: userRole,
        hasSession: !!session
      }, null, 2)}
    </pre>
  );
}