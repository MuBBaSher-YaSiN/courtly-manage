import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Hearing {
  id: string;
  case_id: string;
  start_at: string;
  end_at: string;
  courtroom: string;
  status: string;
  notes: string | null;
  cases?: {
    title: string;
    case_number: string;
  };
}

const HearingsPage = () => {
  const [hearings, setHearings] = useState<Hearing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchHearings();
  }, []);

  const fetchHearings = async () => {
    try {
      const { data, error } = await supabase
        .from('hearings')
        .select(`
          *,
          cases (
            title,
            case_number
          )
        `)
        .order('start_at', { ascending: true });

      if (error) throw error;
      setHearings(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch hearings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED': return 'bg-blue-100 text-blue-800';
      case 'IN_PROGRESS': return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      case 'POSTPONED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Hearings</h1>
          <p className="text-muted-foreground">
            Manage court hearings and schedules
          </p>
        </div>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Hearing
        </Button>
      </div>

      <div className="space-y-4">
        {hearings.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No hearings scheduled</h3>
              <p className="text-muted-foreground mb-4">
                Schedule your first hearing to get started
              </p>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Schedule Hearing
              </Button>
            </CardContent>
          </Card>
        ) : (
          hearings.map((hearing) => (
            <Card key={hearing.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {hearing.cases?.title || 'Hearing'}
                      <Badge className={getStatusColor(hearing.status)}>
                        {hearing.status.replace('_', ' ')}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Case: {hearing.cases?.case_number}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Start Time</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(hearing.start_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">End Time</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(hearing.end_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium">Courtroom</p>
                      <p className="text-sm text-muted-foreground">
                        {hearing.courtroom}
                      </p>
                    </div>
                  </div>
                </div>
                {hearing.notes && (
                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-1">Notes:</p>
                    <p className="text-sm">{hearing.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default HearingsPage;