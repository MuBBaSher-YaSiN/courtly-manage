import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, Calendar, FileText, Bell, Users, Gavel } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

const Dashboard = () => {
  const { session } = useAuth();
  const [stats, setStats] = useState({
    totalCases: 0,
    activeCases: 0,
    upcomingHearings: 0,
    unreadNotifications: 0,
    totalUsers: 0,
    pendingFilings: 0,
  });

  const userRole = session?.user?.app_metadata?.role || 'PUBLIC';

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch total cases
        const { count: totalCases } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true });

        // Fetch active cases
        const { count: activeCases } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'ACTIVE');

        // Fetch upcoming hearings (next 30 days)
        const { count: upcomingHearings } = await supabase
          .from('hearings')
          .select('*', { count: 'exact', head: true })
          .gte('start_at', new Date().toISOString())
          .lt('start_at', new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString());

        // Fetch unread notifications for current user
        const { count: unreadNotifications } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('read', false);

        // Admin-only stats
        let totalUsers = 0;
        let pendingFilings = 0;

        if (userRole === 'ADMIN') {
          const { count: usersCount } = await supabase
            .from('users')
            .select('*', { count: 'exact', head: true });
          totalUsers = usersCount || 0;

          const { count: filingsCount } = await supabase
            .from('filings')
            .select('*', { count: 'exact', head: true })
            .eq('status', 'SUBMITTED');
          pendingFilings = filingsCount || 0;
        }

        setStats({
          totalCases: totalCases || 0,
          activeCases: activeCases || 0,
          upcomingHearings: upcomingHearings || 0,
          unreadNotifications: unreadNotifications || 0,
          totalUsers,
          pendingFilings,
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchStats();
  }, [userRole]);

  const getStatCards = () => {
    const baseCards = [
      {
        title: 'Total Cases',
        value: stats.totalCases,
        description: 'All cases in the system',
        icon: Scale,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
      },
      {
        title: 'Active Cases',
        value: stats.activeCases,
        description: 'Currently active cases',
        icon: FileText,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      },
      {
        title: 'Upcoming Hearings',
        value: stats.upcomingHearings,
        description: 'Next 30 days',
        icon: Calendar,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
      },
      {
        title: 'Notifications',
        value: stats.unreadNotifications,
        description: 'Unread notifications',
        icon: Bell,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
      },
    ];

    const adminCards = [
      {
        title: 'Total Users',
        value: stats.totalUsers,
        description: 'Registered users',
        icon: Users,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
      },
      {
        title: 'Pending Filings',
        value: stats.pendingFilings,
        description: 'Awaiting review',
        icon: Gavel,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      },
    ];

    if (userRole === 'ADMIN') {
      return [...baseCards, ...adminCards];
    }

    return baseCards;
  };

  const statCards = getStatCards();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your court system.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((card, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
              <div className={`w-8 h-8 ${card.bgColor} rounded-full flex items-center justify-center`}>
                <card.icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground">{card.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>Latest case activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <p className="font-medium">CASE-001</p>
                  <p className="text-sm text-muted-foreground">Land Dispute - Smith vs. Johnson</p>
                </div>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Active</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Schedule</CardTitle>
            <CardDescription>Your upcoming hearings</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                <div>
                  <p className="font-medium">Hearing - CASE-001</p>
                  <p className="text-sm text-muted-foreground">Courtroom A</p>
                </div>
                <span className="text-xs text-muted-foreground">In 7 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;