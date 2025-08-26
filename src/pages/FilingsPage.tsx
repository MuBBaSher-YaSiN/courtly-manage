import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Gavel, Check, X, Eye, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Filing {
  id: string;
  case_id: string;
  filing_type: string;
  description: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  submitted_at: string;
  submitted_by_id: string;
  reviewed_by_id?: string;
  review_notes?: string;
  cases?: {
    case_number: string;
    title: string;
  };
  submitted_by?: {
    username: string;
    email: string;
  };
}

const FilingsPage = () => {
  const [filings, setFilings] = useState<Filing[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewingFiling, setReviewingFiling] = useState<Filing | null>(null);
  const { session } = useAuth();
  const { toast } = useToast();

  const userRole = session?.user?.app_metadata?.role?.toLowerCase() || 'public';

  useEffect(() => {
    fetchFilings();
  }, []);

  const fetchFilings = async () => {
    try {
      const { data, error } = await supabase
        .from('filings')
        .select(`
          *,
          cases(case_number, title)
        `)
        .order('submitted_at', { ascending: false });

      if (error) throw error;
      setFilings(data || []);
    } catch (error) {
      console.error('Error fetching filings:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch filings',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReviewFiling = async (filingId: string, status: 'APPROVED' | 'REJECTED', reviewNotes?: string) => {
    try {
      if (!session?.user) return;

      // Get current user's ID from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', session.user.id)
        .single();

      if (userError) throw userError;

      const { error } = await supabase
        .from('filings')
        .update({
          status,
          reviewed_by_id: userData.id,
          review_notes: reviewNotes || null
        })
        .eq('id', filingId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: `Filing ${status.toLowerCase()} successfully`,
      });

      setReviewingFiling(null);
      fetchFilings();
    } catch (error) {
      console.error('Error reviewing filing:', error);
      toast({
        title: 'Error',
        description: 'Failed to review filing',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'SUBMITTED': return 'bg-blue-100 text-blue-800';
      case 'UNDER_REVIEW': return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED': return 'bg-green-100 text-green-800';
      case 'REJECTED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getFilingTypeColor = (type: string) => {
    switch (type) {
      case 'MOTION': return 'bg-purple-100 text-purple-800';
      case 'PLEADING': return 'bg-indigo-100 text-indigo-800';
      case 'EVIDENCE': return 'bg-orange-100 text-orange-800';
      case 'BRIEF': return 'bg-teal-100 text-teal-800';
      case 'OTHER': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const canReviewFilings = ['judge', 'clerk', 'admin'].includes(userRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Gavel className="w-8 h-8" />
            Filings Review
          </h1>
          <p className="text-muted-foreground">
            {canReviewFilings 
              ? 'Review and approve case filings submitted by parties'
              : 'View your submitted filings and their status'
            }
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Filings</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filings.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {filings.filter(f => ['SUBMITTED', 'UNDER_REVIEW'].includes(f.status)).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {filings.filter(f => f.status === 'APPROVED').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {filings.filter(f => f.status === 'REJECTED').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filings Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            {canReviewFilings ? 'All Filings' : 'Your Filings'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Case</TableHead>
                <TableHead>Filing Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead>Submitted By</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filings.map((filing) => (
                <TableRow key={filing.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">
                        {filing.cases?.case_number || 'Unknown'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {filing.cases?.title || ''}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getFilingTypeColor(filing.filing_type)}>
                      {filing.filing_type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadgeColor(filing.status)}>
                      {filing.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {new Date(filing.submitted_at).toLocaleDateString()}
                      <br />
                      <span className="text-muted-foreground">
                        {new Date(filing.submitted_at).toLocaleTimeString()}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {filing.submitted_by?.username || 'Unknown'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Filing Details</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <strong>Case:</strong> {filing.cases?.case_number}
                              </div>
                              <div>
                                <strong>Type:</strong> {filing.filing_type}
                              </div>
                              <div>
                                <strong>Status:</strong> {filing.status}
                              </div>
                              <div>
                                <strong>Submitted:</strong> {new Date(filing.submitted_at).toLocaleString()}
                              </div>
                            </div>
                            <div>
                              <strong>Description:</strong>
                              <div className="mt-2 p-3 bg-muted rounded text-sm">
                                {filing.description}
                              </div>
                            </div>
                            {filing.review_notes && (
                              <div>
                                <strong>Review Notes:</strong>
                                <div className="mt-2 p-3 bg-muted rounded text-sm">
                                  {filing.review_notes}
                                </div>
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                      
                      {canReviewFilings && ['SUBMITTED', 'UNDER_REVIEW'].includes(filing.status) && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => setReviewingFiling(filing)}
                            >
                              <Gavel className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Review Filing</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <strong>Case:</strong> {filing.cases?.case_number} - {filing.cases?.title}
                              </div>
                              <div>
                                <strong>Filing Type:</strong> {filing.filing_type}
                              </div>
                              <div>
                                <strong>Description:</strong>
                                <div className="mt-2 p-3 bg-muted rounded text-sm">
                                  {filing.description}
                                </div>
                              </div>
                              
                              <div className="space-y-2">
                                <label className="text-sm font-medium">Review Notes (Optional)</label>
                                <Textarea
                                  placeholder="Add review notes..."
                                  id="review-notes"
                                />
                              </div>
                              
                              <div className="flex justify-end space-x-2">
                                <Button
                                  variant="outline"
                                  onClick={() => {
                                    const notes = (document.getElementById('review-notes') as HTMLTextAreaElement)?.value;
                                    handleReviewFiling(filing.id, 'REJECTED', notes);
                                  }}
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                                <Button
                                  onClick={() => {
                                    const notes = (document.getElementById('review-notes') as HTMLTextAreaElement)?.value;
                                    handleReviewFiling(filing.id, 'APPROVED', notes);
                                  }}
                                >
                                  <Check className="w-4 h-4 mr-2" />
                                  Approve
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filings.length === 0 && (
            <div className="text-center py-12">
              <Gavel className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No filings found</h3>
              <p className="text-muted-foreground">
                {canReviewFilings 
                  ? 'No filings have been submitted for review yet.'
                  : 'You haven\'t submitted any filings yet.'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FilingsPage;