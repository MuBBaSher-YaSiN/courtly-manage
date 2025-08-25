-- Create missing notifications table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications if not already enabled
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate
DROP POLICY IF EXISTS "notifications_all" ON public.notifications;
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Insert seed data with correct enum values
INSERT INTO public.users (auth_user_id, email, username, role, active)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'judge@example.com', 'judge_john', 'JUDGE', true),
    ('22222222-2222-2222-2222-222222222222', 'attorney@example.com', 'attorney_amy', 'ATTORNEY', true),
    ('33333333-3333-3333-3333-333333333333', 'clerk@example.com', 'clerk_clara', 'CLERK', true),
    ('44444444-4444-4444-4444-444444444444', 'public@example.com', 'public_paul', 'PUBLIC', true)
ON CONFLICT (auth_user_id) DO NOTHING;

-- Insert a sample case with correct enum values
INSERT INTO public.cases (case_number, title, type, status, priority, created_by_id, assigned_judge_id)
VALUES (
    'CASE-001',
    'Land Dispute - Smith vs. Johnson',
    'CIVIL',
    'ACTIVE',  -- Using correct enum value
    'NORMAL',
    (SELECT id FROM public.users WHERE email = 'attorney@example.com'),
    (SELECT id FROM public.users WHERE email = 'judge@example.com')
)
ON CONFLICT (case_number) DO NOTHING;

-- Insert a sample hearing (7 days from now)
INSERT INTO public.hearings (case_id, start_at, end_at, courtroom, notes, created_by_id)
SELECT 
    c.id,
    now() + interval '7 days',
    now() + interval '7 days' + interval '2 hours',
    'Courtroom A',
    'Initial hearing for land dispute case',
    u.id
FROM public.cases c, public.users u
WHERE c.case_number = 'CASE-001' 
  AND u.email = 'judge@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.hearings WHERE case_id = c.id);

-- Insert a sample notification
INSERT INTO public.notifications (user_id, title, message)
SELECT 
    u.id,
    'Hearing Scheduled',
    'Your case CASE-001 has been scheduled for a hearing in 7 days.'
FROM public.users u
WHERE u.email = 'attorney@example.com'
  AND NOT EXISTS (SELECT 1 FROM public.notifications WHERE user_id = u.id AND title = 'Hearing Scheduled');