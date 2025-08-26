import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Calendar, FileText, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface PublicStats {
  myCases: number;
  myHearings: number;
  myDocuments: number;
  notifications: number;
}

const PublicPanel = () => {
  const [stats, setStats] = useState<PublicStats>({
    myCases: 0,
    myHearings: 0,
    myDocuments: 0,
    notifications: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchPublicStats();
    }
  }, [user]);

  const fetchPublicStats = async () => {
    try {
      // Get current user's database ID
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!currentUser) return;

      // Get cases where user is involved (created by them or participant)
      const { count: myCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('created_by_id', currentUser.id);

      // Get hearings for user's cases
      const { count: myHearings } = await supabase
        .from('hearings')
        .select('*, cases!inner(*)', { count: 'exact', head: true })
        .eq('cases.created_by_id', currentUser.id);

      // Get documents uploaded by user
      const { count: myDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('uploaded_by_id', currentUser.id);

      // Get user notifications
      const { count: notifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      setStats({
        myCases: myCases || 0,
        myHearings: myHearings || 0,
        myDocuments: myDocuments || 0,
        notifications: notifications || 0
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch your statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'My Cases',
      value: stats.myCases,
      description: 'Cases you are involved in',
      icon: Scale,
      color: 'text-blue-600'
    },
    {
      title: 'My Hearings',
      value: stats.myHearings,
      description: 'Scheduled court appearances',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'My Documents',
      value: stats.myDocuments,
      description: 'Documents you uploaded',
      icon: FileText,
      color: 'text-orange-600'
    },
    {
      title: 'Notifications',
      value: stats.notifications,
      description: 'Unread notifications',
      icon: Bell,
      color: 'text-red-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Scale className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <Badge variant="secondary">Public User</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <Scale className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">My Dashboard</h1>
        <Badge variant="secondary">Public User</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <card.icon className={`w-4 h-4 ${card.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Legal Services</CardTitle>
          <CardDescription>
            Access court services and manage your legal matters
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Available Services</h3>
              <ul className="text-sm space-y-1">
                <li>• File new cases</li>
                <li>• View case progress</li>
                <li>• Upload supporting documents</li>
                <li>• Track hearing schedules</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Information Access</h3>
              <ul className="text-sm space-y-1">
                <li>• View case documents</li>
                <li>• Check hearing dates</li>
                <li>• Receive notifications</li>
                <li>• Access court forms</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PublicPanel;