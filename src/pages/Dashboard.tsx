import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scale, FileText, Calendar, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface DashboardStats {
  totalCases: number;
  myFilings: number;
  upcomingHearings: number;
  recentActivity: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    myFilings: 0,
    upcomingHearings: 0,
    recentActivity: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      try {
        // Get user profile
        const { data: profile } = await supabase
          .from('users')
          .select('id')
          .eq('auth_user_id', user.id)
          .single();

        if (!profile) return;

        // Fetch total cases (user is involved in)
        const { count: casesCount } = await supabase
          .from('cases')
          .select('*', { count: 'exact', head: true })
          .or(`created_by_id.eq.${profile.id},assigned_judge_id.eq.${profile.id}`);

        // Fetch user's filings
        const { count: filingsCount } = await supabase
          .from('filings')
          .select('*', { count: 'exact', head: true })
          .eq('submitted_by_id', profile.id);

        // Fetch upcoming hearings
        const { count: hearingsCount } = await supabase
          .from('hearings')
          .select('*', { count: 'exact', head: true })
          .gte('start_at', new Date().toISOString())
          .in('case_id', 
            (await supabase
              .from('cases')
              .select('id')
              .or(`created_by_id.eq.${profile.id},assigned_judge_id.eq.${profile.id}`)
            ).data?.map(c => c.id) || []
          );

        setStats({
          totalCases: casesCount || 0,
          myFilings: filingsCount || 0,
          upcomingHearings: hearingsCount || 0,
          recentActivity: 0, // Placeholder
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your court activities.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Cases</CardTitle>
            <Scale className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">
              Cases you're involved in
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">My Filings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.myFilings}</div>
            <p className="text-xs text-muted-foreground">
              Documents you've filed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Hearings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingHearings}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled hearings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentActivity}</div>
            <p className="text-xs text-muted-foreground">
              Actions this week
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Cases</CardTitle>
            <CardDescription>
              Your most recently filed or updated cases
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              No recent cases to display
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Common tasks you might want to perform
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-sm">
              <a href="/cases" className="text-primary hover:underline">
                • View all cases
              </a>
            </div>
            <div className="text-sm">
              <a href="/filings" className="text-primary hover:underline">
                • Submit new filing
              </a>
            </div>
            <div className="text-sm">
              <a href="/calendar" className="text-primary hover:underline">
                • Check calendar
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}