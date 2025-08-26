import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calendar, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface HearingSchedulerProps {
  caseId?: string;
  onScheduleComplete?: () => void;
}

interface Case {
  id: string;
  case_number: string;
  title: string;
}

const HearingScheduler = ({ caseId, onScheduleComplete }: HearingSchedulerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState(caseId || '');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [duration, setDuration] = useState('2'); // hours
  const [courtroom, setCourtroom] = useState('');
  const [notes, setNotes] = useState('');
  const [cases, setCases] = useState<Case[]>([]);
  const [casesLoaded, setCasesLoaded] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const loadCases = async () => {
    if (casesLoaded) return;
    
    try {
      const { data, error } = await supabase
        .from('cases')
        .select('id, case_number, title')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCases(data || []);
      setCasesLoaded(true);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to load cases',
        variant: 'destructive',
      });
    }
  };

  const handleSchedule = async () => {
    if (!selectedCaseId || !startDate || !startTime || !courtroom || !user) {
      toast({
        title: 'Missing information',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    setIsScheduling(true);

    try {
      // Get current user's database ID
      const { data: currentUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_user_id', user.id)
        .single();

      if (!currentUser) {
        throw new Error('User not found');
      }

      // Check if user has permission to schedule hearings
      if (!['clerk', 'judge', 'admin'].includes(currentUser.role.toLowerCase())) {
        throw new Error('You do not have permission to schedule hearings');
      }

      // Create start and end datetime
      const startDateTime = new Date(`${startDate}T${startTime}`);
      const endDateTime = new Date(startDateTime);
      endDateTime.setHours(endDateTime.getHours() + parseInt(duration));

      // Check if the datetime is in the future
      if (startDateTime <= new Date()) {
        throw new Error('Hearing must be scheduled for a future date and time');
      }

      // Insert hearing record
      const { error: insertError } = await supabase
        .from('hearings')
        .insert({
          case_id: selectedCaseId,
          start_at: startDateTime.toISOString(),
          end_at: endDateTime.toISOString(),
          courtroom,
          status: 'SCHEDULED',
          notes: notes.trim() || null,
          created_by_id: currentUser.id
        });

      if (insertError) throw insertError;

      toast({
        title: 'Success',
        description: 'Hearing scheduled successfully',
      });

      // Reset form and close dialog
      setSelectedCaseId(caseId || '');
      setStartDate('');
      setStartTime('');
      setDuration('2');
      setCourtroom('');
      setNotes('');
      setIsOpen(false);
      
      // Call callback if provided
      onScheduleComplete?.();
      
    } catch (error: any) {
      toast({
        title: 'Scheduling failed',
        description: error.message || 'Failed to schedule hearing',
        variant: 'destructive',
      });
    } finally {
      setIsScheduling(false);
    }
  };

  const courtrooms = [
    'Courtroom A',
    'Courtroom B', 
    'Courtroom C',
    'Courtroom D',
    'Main Courtroom',
    'Conference Room 1',
    'Conference Room 2'
  ];

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button onClick={loadCases}>
          <Plus className="w-4 h-4 mr-2" />
          Schedule Hearing
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Schedule Hearing</DialogTitle>
          <DialogDescription>
            Schedule a court hearing for a case
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="case-select">Case *</Label>
            <Select value={selectedCaseId} onValueChange={setSelectedCaseId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a case" />
              </SelectTrigger>
              <SelectContent>
                {cases.map((case_) => (
                  <SelectItem key={case_.id} value={case_.id}>
                    {case_.case_number} - {case_.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="start-date">Date *</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start-time">Time *</Label>
              <Input
                id="start-time"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (hours)</Label>
              <Select value={duration} onValueChange={setDuration}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 hour</SelectItem>
                  <SelectItem value="2">2 hours</SelectItem>
                  <SelectItem value="3">3 hours</SelectItem>
                  <SelectItem value="4">4 hours</SelectItem>
                  <SelectItem value="6">6 hours</SelectItem>
                  <SelectItem value="8">Full day</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="courtroom">Courtroom *</Label>
              <Select value={courtroom} onValueChange={setCourtroom}>
                <SelectTrigger>
                  <SelectValue placeholder="Select courtroom" />
                </SelectTrigger>
                <SelectContent>
                  {courtrooms.map((room) => (
                    <SelectItem key={room} value={room}>
                      {room}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes about the hearing..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!selectedCaseId || !startDate || !startTime || !courtroom || isScheduling}
          >
            {isScheduling ? 'Scheduling...' : 'Schedule Hearing'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default HearingScheduler;