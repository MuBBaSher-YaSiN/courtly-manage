import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Calendar, FileText, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface AttorneyStats {
  myCases: number;
  upcomingHearings: number;
  myDocuments: number;
  clients: number;
}

const AttorneyPanel = () => {
  const [stats, setStats] = useState<AttorneyStats>({
    myCases: 0,
    upcomingHearings: 0,
    myDocuments: 0,
    clients: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchAttorneyStats();
    }
  }, [user]);

  const fetchAttorneyStats = async () => {
    try {
      // Get current user's database ID
      const { data: currentUser } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user?.id)
        .single();

      if (!currentUser) return;

      // Get cases created by this attorney
      const { count: myCases } = await supabase
        .from('cases')
        .select('*', { count: 'exact', head: true })
        .eq('created_by_id', currentUser.id);

      // Get upcoming hearings for attorney's cases
      const { count: upcomingHearings } = await supabase
        .from('hearings')
        .select('*, cases!inner(*)', { count: 'exact', head: true })
        .eq('cases.created_by_id', currentUser.id)
        .gte('start_at', new Date().toISOString());

      // Get documents uploaded by this attorney
      const { count: myDocuments } = await supabase
        .from('documents')
        .select('*', { count: 'exact', head: true })
        .eq('uploaded_by_id', currentUser.id);

      // Get clients (case participants where this attorney represents them)
      const { count: clients } = await supabase
        .from('case_participants')
        .select('*, cases!inner(*)', { count: 'exact', head: true })
        .eq('cases.created_by_id', currentUser.id)
        .eq('role_in_case', 'PLAINTIFF');

      setStats({
        myCases: myCases || 0,
        upcomingHearings: upcomingHearings || 0,
        myDocuments: myDocuments || 0,
        clients: clients || 0
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch attorney statistics',
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
      description: 'Cases you are handling',
      icon: Scale,
      color: 'text-blue-600'
    },
    {
      title: 'Upcoming Hearings',
      value: stats.upcomingHearings,
      description: 'Scheduled appearances',
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
      title: 'Clients',
      value: stats.clients,
      description: 'Active client cases',
      icon: Users,
      color: 'text-purple-600'
    }
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2 mb-6">
          <Scale className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">Attorney Dashboard</h1>
          <Badge variant="secondary">Attorney</Badge>
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
        <h1 className="text-2xl font-bold">Attorney Dashboard</h1>
        <Badge variant="secondary">Attorney</Badge>
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
          <CardTitle>Legal Practice</CardTitle>
          <CardDescription>
            Manage your legal practice and client representation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Case Management</h3>
              <ul className="text-sm space-y-1">
                <li>• File new cases</li>
                <li>• Submit legal filings</li>
                <li>• Upload case documents</li>
                <li>• Track case progress</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Client Services</h3>
              <ul className="text-sm space-y-1">
                <li>• Represent clients in court</li>
                <li>• Prepare legal documents</li>
                <li>• Schedule consultations</li>
                <li>• Monitor hearing dates</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AttorneyPanel;