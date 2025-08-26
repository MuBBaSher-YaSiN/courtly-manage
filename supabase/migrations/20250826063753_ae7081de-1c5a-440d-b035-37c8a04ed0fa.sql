-- Complete Court Management System Database Setup
-- Drop and recreate user_role enum with lowercase values
DROP TYPE IF EXISTS user_role CASCADE;
CREATE TYPE user_role AS ENUM ('public', 'judge', 'attorney', 'clerk', 'admin');

-- Drop and recreate case_status enum  
DROP TYPE IF EXISTS case_status CASCADE;
CREATE TYPE case_status AS ENUM ('open', 'in_progress', 'closed');

-- Drop and recreate other enums
DROP TYPE IF EXISTS case_type CASCADE;
CREATE TYPE case_type AS ENUM ('civil', 'criminal', 'family', 'probate', 'traffic');

DROP TYPE IF EXISTS case_priority CASCADE;
CREATE TYPE case_priority AS ENUM ('low', 'normal', 'high', 'urgent');

DROP TYPE IF EXISTS hearing_status CASCADE;
CREATE TYPE hearing_status AS ENUM ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed');

DROP TYPE IF EXISTS filing_status CASCADE;
CREATE TYPE filing_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected');

DROP TYPE IF EXISTS filing_type CASCADE;
CREATE TYPE filing_type AS ENUM ('motion', 'petition', 'response', 'brief', 'evidence', 'other');

DROP TYPE IF EXISTS document_visibility CASCADE;
CREATE TYPE document_visibility AS ENUM ('public', 'private', 'restricted');

DROP TYPE IF EXISTS audit_action CASCADE;
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'view', 'download');

DROP TYPE IF EXISTS participant_role CASCADE;
CREATE TYPE participant_role AS ENUM ('plaintiff', 'defendant', 'attorney', 'witness', 'other');

-- Clean up existing tables
DROP TABLE IF EXISTS case_participants CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS hearings CASCADE;
DROP TABLE IF EXISTS filings CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS cases CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Create users table
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id UUID UNIQUE NOT NULL,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role user_role NOT NULL DEFAULT 'public',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create cases table
CREATE TABLE public.cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    type case_type NOT NULL DEFAULT 'civil',
    status case_status NOT NULL DEFAULT 'open',
    priority case_priority NOT NULL DEFAULT 'normal',
    created_by_id UUID NOT NULL,
    assigned_judge_id UUID,
    filed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create hearings table
CREATE TABLE public.hearings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    courtroom TEXT NOT NULL,
    status hearing_status NOT NULL DEFAULT 'scheduled',
    notes TEXT,
    created_by_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create documents table
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    original_name TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    size BIGINT NOT NULL,
    mime_type TEXT NOT NULL,
    visibility document_visibility NOT NULL DEFAULT 'private',
    uploaded_by_id UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create filings table
CREATE TABLE public.filings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    submitted_by_id UUID NOT NULL,
    filing_type filing_type NOT NULL,
    description TEXT NOT NULL,
    status filing_status NOT NULL DEFAULT 'submitted',
    reviewed_by_id UUID,
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create notifications table
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit_log table
CREATE TABLE public.audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action audit_action NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create case_participants table
CREATE TABLE public.case_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL,
    user_id UUID NOT NULL,
    role_in_case participant_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(case_id, user_id, role_in_case)
);

-- Create system_settings table
CREATE TABLE public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create update timestamp function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create update triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hearings_updated_at BEFORE UPDATE ON public.hearings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_filings_updated_at BEFORE UPDATE ON public.filings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create user creation trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    INSERT INTO public.users (
        auth_user_id, 
        email, 
        username, 
        role
    )
    VALUES (
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
        CASE 
            WHEN NEW.email = 'admin@court.gov' THEN 'admin'::user_role
            ELSE 'public'::user_role
        END
    )
    ON CONFLICT (auth_user_id) 
    DO UPDATE SET 
        email = EXCLUDED.email,
        role = CASE 
            WHEN EXCLUDED.email = 'admin@court.gov' THEN 'admin'::user_role
            ELSE users.role
        END;
    RETURN NEW;
END;
$function$;

-- Create auth trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
    auth.uid() = auth_user_id OR 
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'
);

CREATE POLICY "users_insert" ON public.users FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "users_update" ON public.users FOR UPDATE USING (
    auth.uid() = auth_user_id OR 
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'
) WITH CHECK (
    auth.uid() = auth_user_id OR 
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'
);

CREATE POLICY "users_delete" ON public.users FOR DELETE USING (
    auth.uid() = auth_user_id OR 
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'
);

-- RLS Policies for cases
CREATE POLICY "cases_select" ON public.cases FOR SELECT USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'admin' OR
    created_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
    assigned_judge_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
    EXISTS (
        SELECT 1 FROM public.case_participants cp 
        WHERE cp.case_id = cases.id AND cp.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY "cases_insert" ON public.cases FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('attorney', 'clerk', 'judge', 'public')
);

CREATE POLICY "cases_update" ON public.cases FOR UPDATE USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('admin', 'judge', 'clerk') OR
    created_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for hearings
CREATE POLICY "hearings_select" ON public.hearings FOR SELECT USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('admin', 'judge', 'clerk') OR
    EXISTS (
        SELECT 1 FROM public.case_participants cp 
        WHERE cp.case_id = hearings.case_id AND cp.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY "hearings_insert" ON public.hearings FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('clerk', 'judge', 'admin')
);

CREATE POLICY "hearings_update" ON public.hearings FOR UPDATE USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('admin', 'judge', 'clerk')
);

-- RLS Policies for documents
CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'admin' OR
    uploaded_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
    visibility = 'public' OR
    EXISTS (
        SELECT 1 FROM public.case_participants cp 
        WHERE cp.case_id = documents.case_id AND cp.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY "documents_insert" ON public.documents FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('attorney', 'clerk', 'judge', 'public')
);

CREATE POLICY "documents_update" ON public.documents FOR UPDATE USING (
    uploaded_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('judge', 'clerk', 'admin')
);

-- RLS Policies for filings
CREATE POLICY "filings_select" ON public.filings FOR SELECT USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'admin' OR
    submitted_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid()) OR
    EXISTS (
        SELECT 1 FROM public.case_participants cp 
        WHERE cp.case_id = filings.case_id AND cp.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY "filings_insert" ON public.filings FOR INSERT WITH CHECK (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('attorney', 'clerk', 'judge', 'public')
);

CREATE POLICY "filings_update" ON public.filings FOR UPDATE USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('judge', 'clerk', 'admin') OR
    submitted_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for notifications
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for audit_log
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'
);

CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT WITH CHECK (true);

-- RLS Policies for case_participants
CREATE POLICY "case_participants_all" ON public.case_participants FOR ALL USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) IN ('admin', 'judge', 'clerk') OR
    user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for system_settings
CREATE POLICY "system_settings_all" ON public.system_settings FOR ALL USING (
    (SELECT role FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'
);

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for documents bucket
CREATE POLICY "documents_bucket_select" ON storage.objects FOR SELECT USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "documents_bucket_insert" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "documents_bucket_update" ON storage.objects FOR UPDATE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "documents_bucket_delete" ON storage.objects FOR DELETE USING (
    bucket_id = 'documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
);

-- Seed data
-- Insert test users (these will be created when they sign up)
INSERT INTO public.users (auth_user_id, username, email, role) VALUES
    ('11111111-1111-1111-1111-111111111111', 'judge_john', 'judge@example.com', 'judge'),
    ('22222222-2222-2222-2222-222222222222', 'attorney_amy', 'attorney@example.com', 'attorney'),
    ('33333333-3333-3333-3333-333333333333', 'clerk_clara', 'clerk@example.com', 'clerk'),
    ('44444444-4444-4444-4444-444444444444', 'public_paul', 'public@example.com', 'public')
ON CONFLICT (auth_user_id) DO NOTHING;

-- Get the created user IDs for seeding
DO $$
DECLARE
    judge_id UUID;
    attorney_id UUID;
    clerk_id UUID;
    public_id UUID;
    case_id UUID;
BEGIN
    -- Get user IDs
    SELECT id INTO judge_id FROM public.users WHERE email = 'judge@example.com';
    SELECT id INTO attorney_id FROM public.users WHERE email = 'attorney@example.com';
    SELECT id INTO clerk_id FROM public.users WHERE email = 'clerk@example.com';
    SELECT id INTO public_id FROM public.users WHERE email = 'public@example.com';
    
    -- Insert test case
    INSERT INTO public.cases (case_number, title, type, status, priority, created_by_id, assigned_judge_id)
    VALUES ('CASE-001', 'Land Dispute', 'civil', 'open', 'normal', attorney_id, judge_id)
    RETURNING id INTO case_id;
    
    -- Insert test hearing
    INSERT INTO public.hearings (case_id, start_at, end_at, courtroom, status, created_by_id)
    VALUES (case_id, now() + interval '7 days', now() + interval '7 days 2 hours', 'Courtroom A', 'scheduled', clerk_id);
    
    -- Insert test document
    INSERT INTO public.documents (case_id, original_name, storage_key, size, mime_type, visibility, uploaded_by_id)
    VALUES (case_id, 'evidence.pdf', 'test/evidence.pdf', 1024, 'application/pdf', 'private', attorney_id);
    
    -- Insert test filing
    INSERT INTO public.filings (case_id, submitted_by_id, filing_type, description, status)
    VALUES (case_id, attorney_id, 'motion', 'Motion for Summary Judgment', 'submitted');
    
    -- Insert test notification
    INSERT INTO public.notifications (user_id, title, message)
    VALUES (judge_id, 'New Case Assigned', 'You have been assigned to CASE-001: Land Dispute');
    
    -- Insert case participants
    INSERT INTO public.case_participants (case_id, user_id, role_in_case)
    VALUES 
        (case_id, attorney_id, 'attorney'),
        (case_id, public_id, 'plaintiff');
END $$;