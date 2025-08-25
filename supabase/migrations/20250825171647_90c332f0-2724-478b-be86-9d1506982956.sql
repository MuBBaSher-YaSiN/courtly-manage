-- Insert seed data for testing
-- Demo users with hashed passwords (password: demo123)
INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token) VALUES
('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'judge@example.com', '$2a$10$K4a9o2KrTsA2/XQNN7lxHeYyWZAqzYbILOQo3o8XpO8x1FqZ9VzOq', now(), '{"role": "JUDGE"}', '{}', now(), now(), '', '', '', ''),
('22222222-2222-2222-2222-222222222222', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'attorney@example.com', '$2a$10$K4a9o2KrTsA2/XQNN7lxHeYyWZAqzYbILOQo3o8XpO8x1FqZ9VzOq', now(), '{"role": "ATTORNEY"}', '{}', now(), now(), '', '', '', ''),
('33333333-3333-3333-3333-333333333333', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'clerk@example.com', '$2a$10$K4a9o2KrTsA2/XQNN7lxHeYyWZAqzYbILOQo3o8XpO8x1FqZ9VzOq', now(), '{"role": "CLERK"}', '{}', now(), now(), '', '', '', ''),
('44444444-4444-4444-4444-444444444444', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'public@example.com', '$2a$10$K4a9o2KrTsA2/XQNN7lxHeYyWZAqzYbILOQo3o8XpO8x1FqZ9VzOq', now(), '{"role": "PUBLIC"}', '{}', now(), now(), '', '', '', ''),
('55555555-5555-5555-5555-555555555555', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@courtmgmt.com', '$2a$10$K4a9o2KrTsA2/XQNN7lxHeYyWZAqzYbILOQo3o8XpO8x1FqZ9VzOq', now(), '{"role": "ADMIN"}', '{}', now(), now(), '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Update the corresponding public.users records
UPDATE public.users SET role = 'JUDGE' WHERE auth_user_id = '11111111-1111-1111-1111-111111111111';
UPDATE public.users SET role = 'ATTORNEY' WHERE auth_user_id = '22222222-2222-2222-2222-222222222222';
UPDATE public.users SET role = 'CLERK' WHERE auth_user_id = '33333333-3333-3333-3333-333333333333';
UPDATE public.users SET role = 'PUBLIC' WHERE auth_user_id = '44444444-4444-4444-4444-444444444444';
UPDATE public.users SET role = 'ADMIN' WHERE auth_user_id = '55555555-5555-5555-5555-555555555555';

-- Insert a sample case
INSERT INTO public.cases (id, case_number, title, type, status, priority, created_by_id, assigned_judge_id, filed_at) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'CASE-001', 'Land Dispute - Smith vs. Johnson', 'CIVIL', 'ASSIGNED', 'NORMAL', 
 (SELECT id FROM public.users WHERE email = 'attorney@example.com'),
 (SELECT id FROM public.users WHERE email = 'judge@example.com'),
 now())
ON CONFLICT (id) DO NOTHING;

-- Insert case participants
INSERT INTO public.case_participants (case_id, user_id, role_in_case) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM public.users WHERE email = 'attorney@example.com'), 'ATTORNEY'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', (SELECT id FROM public.users WHERE email = 'public@example.com'), 'PLAINTIFF')
ON CONFLICT (case_id, user_id, role_in_case) DO NOTHING;

-- Insert a hearing scheduled in 7 days
INSERT INTO public.hearings (id, case_id, status, start_at, end_at, courtroom, notes, created_by_id) VALUES
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'SCHEDULED', 
 now() + interval '7 days' + interval '10 hours',
 now() + interval '7 days' + interval '12 hours',
 'Courtroom A',
 'Initial hearing for land dispute case',
 (SELECT id FROM public.users WHERE email = 'judge@example.com'))
ON CONFLICT (id) DO NOTHING;

-- Insert a demo document
INSERT INTO public.documents (id, case_id, original_name, storage_key, mime_type, size, visibility, uploaded_by_id) VALUES
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'case_summary.pdf', 'documents/case_summary.pdf', 'application/pdf', 1024000, 'PRIVATE',
 (SELECT id FROM public.users WHERE email = 'attorney@example.com'))
ON CONFLICT (id) DO NOTHING;

-- Insert a demo filing
INSERT INTO public.filings (id, case_id, filing_type, description, status, submitted_by_id) VALUES
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'MOTION', 'Motion for Summary Judgment', 'UNDER_REVIEW',
 (SELECT id FROM public.users WHERE email = 'attorney@example.com'))
ON CONFLICT (id) DO NOTHING;

-- Insert demo notifications
INSERT INTO public.notifications (user_id, title, message) VALUES
((SELECT id FROM public.users WHERE email = 'judge@example.com'), 'New Case Assigned', 'Case CASE-001: Land Dispute has been assigned to you'),
((SELECT id FROM public.users WHERE email = 'attorney@example.com'), 'Hearing Scheduled', 'Your hearing for CASE-001 is scheduled for next week'),
((SELECT id FROM public.users WHERE email = 'public@example.com'), 'Case Update', 'Your case CASE-001 status has been updated to ASSIGNED');

-- Insert system settings
INSERT INTO public.system_settings (key, value) VALUES
('court_name', '"Superior Court of Justice"'),
('court_address', '"123 Justice Avenue, Legal City, LC 12345"'),
('business_hours', '{"start": "08:00", "end": "17:00", "timezone": "America/New_York"}'),
('max_file_size', '10485760'),
('allowed_file_types', '["pdf", "doc", "docx", "txt", "jpg", "png"]')
ON CONFLICT (key) DO NOTHING;