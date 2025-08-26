import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { FileText, Calendar, Users, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ClerkStats {
  totalCases: number;
  scheduledHearings: number;
  pendingFilings: number;
  processedToday: number;
}

const ClerkPanel = () => {
  const [stats, setStats] = useState<ClerkStats>({
    totalCases: 0,
    scheduledHearings: 0,
    pendingFilings: 0,
    processedToday: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchClerkStats();
  }, []);

  const fetchClerkStats = async () => {
    try {
      // Get total cases (clerk can see all)
      const { count: totalCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true });

      // Get all scheduled hearings
      const { count: scheduledHearings } = await supabase
        .from('hearings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'SCHEDULED');

      // Get pending filings
      const { count: pendingFilings } = await supabase
        .from('filings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'SUBMITTED');

      // Get cases processed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count: processedToday } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString())
        .lt('created_at', tomorrow.toISOString());

      setStats({
        totalCases: totalCases || 0,
        scheduledHearings: scheduledHearings || 0,
        pendingFilings: pendingFilings || 0,
        processedToday: processedToday || 0
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch clerk statistics',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Cases',
      value: stats.totalCases,
      description: 'All cases in system',
      icon: FileText,
      color: 'text-blue-600'
    },
    {
      title: 'Scheduled Hearings',
      value: stats.scheduledHearings,
      description: 'Upcoming court sessions',
      icon: Calendar,
      color: 'text-green-600'
    },
    {
      title: 'Pending Filings',
      value: stats.pendingFilings,
      description: 'Awaiting review',
      icon: Users,
      color: 'text-orange-600'
    },
    {
      title: 'Processed Today',
      value: stats.processedToday,
      description: 'Cases filed today',
      icon: CheckCircle,
      color: 'text-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Clerk Dashboard</h1>
          <Badge variant="secondary">Clerk</Badge>
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
        <FileText className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Clerk Dashboard</h1>
        <Badge variant="secondary">Clerk</Badge>
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
          <CardTitle>Court Administration</CardTitle>
          <CardDescription>
            Administrative support for court operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Case Administration</h3>
              <ul className="text-sm space-y-1">
                <li>• Process new case filings</li>
                <li>• Schedule court hearings</li>
                <li>• Maintain case records</li>
                <li>• Generate case reports</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Court Support</h3>
              <ul className="text-sm space-y-1">
                <li>• Coordinate with judges</li>
                <li>• Manage court calendar</li>
                <li>• Process legal documents</li>
                <li>• Assist court proceedings</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClerkPanel;