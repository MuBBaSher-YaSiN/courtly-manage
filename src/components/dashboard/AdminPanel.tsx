import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Users, Scale, Calendar, Bell, FileText, Gavel } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  totalCases: number;
  activeCases: number;
  upcomingHearings: number;
  totalUsers: number;
  totalDocuments: number;
  totalNotifications: number;
}

const AdminPanel = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    upcomingHearings: 0,
    totalUsers: 0,
    totalDocuments: 0,
    totalNotifications: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchAdminStats();
  }, []);

  const fetchAdminStats = async () => {
    try {
      // Get total cases
      const { count: totalCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true });

      // Get active cases
      const { count: activeCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .in('status', ['FILED', 'ACTIVE']);

      // Get upcoming hearings (next 30 days)
      const thirtyDaysFromNow = new Date();
      thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
      
      const { count: upcomingHearings } = await supabase
        .from('hearings')
        .select('*', { count: 'exact', head: true })
        .gte('start_at', new Date().toISOString())
        .lte('start_at', thirtyDaysFromNow.toISOString());

      // Get total users
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get total documents
      const { count: totalDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true });

      // Get total notifications
      const { count: totalNotifications } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true });

      setStats({
        totalCases: totalCases || 0,
        activeCases: activeCases || 0,
        upcomingHearings: upcomingHearings || 0,
        totalUsers: totalUsers || 0,
        totalDocuments: totalDocuments || 0,
        totalNotifications: totalNotifications || 0
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch admin statistics',
        variant: 'destructive',
      });
      console.error('Error fetching admin stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      description: 'All cases in the system',
      icon: Scale,
      color: 'text-blue-600'
    },
    {
      title: 'Active Cases',
      value: stats.activeCases,
      description: 'Open and in-progress cases',
      icon: Gavel,
      color: 'text-green-600'
    },
    {
      title: 'Upcoming Hearings',
      value: stats.upcomingHearings,
      description: 'Next 30 days',
      icon: Calendar,
      color: 'text-orange-600'
    },
    {
      title: 'Total Users',
      value: stats.totalUsers,
      description: 'Registered users',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      title: 'Documents',
      value: stats.totalDocuments,
      description: 'Uploaded documents',
      icon: FileText,
      color: 'text-indigo-600'
    },
    {
      title: 'Notifications',
      value: stats.totalNotifications,
      description: 'System notifications',
      icon: Bell,
      color: 'text-red-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Admin Dashboard</h1>
          <Badge variant="secondary">Administrator</Badge>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
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
        <Users className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Badge variant="secondary">Administrator</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
          <CardTitle>System Overview</CardTitle>
          <CardDescription>
            Complete administrative control over the court management system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Administrative Features</h3>
              <ul className="text-sm space-y-1">
                <li>• User Management & Roles</li>
                <li>• System Configuration</li>
                <li>• Audit Logs & Monitoring</li>
                <li>• Global Case Oversight</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Quick Actions</h3>
              <ul className="text-sm space-y-1">
                <li>• Review Pending Filings</li>
                <li>• Monitor System Health</li>
                <li>• Generate Reports</li>
                <li>• Manage Court Schedules</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPanel;