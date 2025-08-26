import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Gavel, Calendar, FileText, Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface JudgeStats {
  assignedCases: number;
  upcomingHearings: number;
  pendingFilings: number;
  notifications: number;
}

const JudgePanel = () => {
  const [stats, setStats] = useState<JudgeStats>({
    assignedCases: 0,
    upcomingHearings: 0,
    pendingFilings: 0,
    notifications: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchJudgeStats();
    }
  }, [user]);

  const fetchJudgeStats = async () => {
    try {
      // Get current user's database ID
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!currentUser) return;

      // Get assigned cases
      const { count: assignedCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('assigned_judge_id', currentUser.id);

      // Get upcoming hearings for assigned cases
      const { count: upcomingHearings } = await supabase
        .from('hearings')
        .select('*, cases!inner(*)', { count: 'exact', head: true })
        .eq('cases.assigned_judge_id', currentUser.id)
        .gte('start_at', new Date().toISOString());

      // Get pending filings for assigned cases  
      const { count: pendingFilings } = await supabase
        .from('filings')
        .select('*, cases!inner(*)', { count: 'exact', head: true })
        .eq('cases.assigned_judge_id', currentUser.id)
        .eq('status', 'SUBMITTED');

      // Get notifications
      const { count: notifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', currentUser.id)
        .eq('read', false);

      setStats({
        assignedCases: assignedCases || 0,
        upcomingHearings: upcomingHearings || 0,
        pendingFilings: pendingFilings || 0,
        notifications: notifications || 0
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch judge statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Assigned Cases',
      value: stats.assignedCases,
      description: 'Cases under your jurisdiction',
      icon: Gavel,
      color: 'text-blue-600'
    },
    {
      title: 'Upcoming Hearings',
      value: stats.upcomingHearings,
      description: 'Scheduled hearings',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Pending Filings',
      value: stats.pendingFilings,
      description: 'Require your review',
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
          <Gavel className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Judge Dashboard</h1>
          <Badge variant="secondary">Judge</Badge>
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
        <Gavel className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Judge Dashboard</h1>
        <Badge variant="secondary">Judge</Badge>
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
          <CardTitle>Judicial Responsibilities</CardTitle>
          <CardDescription>
            Manage your assigned cases and judicial duties
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Case Management</h3>
              <ul className="text-sm space-y-1">
                <li>• Review assigned cases</li>
                <li>• Schedule court hearings</li>
                <li>• Review legal filings</li>
                <li>• Issue court orders</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Court Administration</h3>
              <ul className="text-sm space-y-1">
                <li>• Manage courtroom calendar</li>
                <li>• Review evidence and documents</li>
                <li>• Coordinate with court staff</li>
                <li>• Monitor case progress</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default JudgePanel;