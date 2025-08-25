-- Create enums for various types
CREATE TYPE user_role AS ENUM ('ADMIN', 'JUDGE', 'ATTORNEY', 'CLERK', 'PUBLIC');
CREATE TYPE case_status AS ENUM ('FILED', 'ASSIGNED', 'IN_PROGRESS', 'SCHEDULED', 'CLOSED', 'DISMISSED');
CREATE TYPE case_type AS ENUM ('CIVIL', 'CRIMINAL', 'FAMILY', 'PROBATE', 'SMALL_CLAIMS', 'TRAFFIC');
CREATE TYPE case_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE hearing_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');
CREATE TYPE document_visibility AS ENUM ('PUBLIC', 'PRIVATE', 'RESTRICTED');
CREATE TYPE filing_status AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE filing_type AS ENUM ('MOTION', 'PETITION', 'BRIEF', 'AFFIDAVIT', 'NOTICE', 'ORDER', 'OTHER');
CREATE TYPE role_in_case AS ENUM ('PLAINTIFF', 'DEFENDANT', 'ATTORNEY', 'WITNESS', 'EXPERT', 'OTHER');
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'ACCESS', 'UPLOAD', 'DOWNLOAD');

-- Users table
CREATE TABLE public.users (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    auth_user_id UUID NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE,
    username TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'PUBLIC',
    active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Cases table
CREATE TABLE public.cases (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_number TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    type case_type NOT NULL,
    status case_status NOT NULL DEFAULT 'FILED',
    priority case_priority NOT NULL DEFAULT 'NORMAL',
    created_by_id UUID NOT NULL,
    assigned_judge_id UUID,
    filed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Case participants table
CREATE TABLE public.case_participants (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL,
    user_id UUID NOT NULL,  
    role_in_case role_in_case NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE(case_id, user_id, role_in_case)
);

-- Hearings table
CREATE TABLE public.hearings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL,
    status hearing_status NOT NULL DEFAULT 'SCHEDULED',
    start_at TIMESTAMP WITH TIME ZONE NOT NULL,
    end_at TIMESTAMP WITH TIME ZONE NOT NULL,
    courtroom TEXT NOT NULL,
    notes TEXT,
    created_by_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Documents table
CREATE TABLE public.documents (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL,
    original_name TEXT NOT NULL,
    storage_key TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size BIGINT NOT NULL,
    visibility document_visibility NOT NULL DEFAULT 'PRIVATE',
    uploaded_by_id UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Filings table
CREATE TABLE public.filings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    case_id UUID NOT NULL,
    filing_type filing_type NOT NULL,
    description TEXT NOT NULL,
    status filing_status NOT NULL DEFAULT 'SUBMITTED',
    submitted_by_id UUID NOT NULL,
    reviewed_by_id UUID,
    review_notes TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Notifications table
CREATE TABLE public.notifications (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    read BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Audit logs table
CREATE TABLE public.audit_log (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id UUID,
    action audit_action NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    meta JSONB DEFAULT '{}'::jsonb,
    timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- System settings table
CREATE TABLE public.system_settings (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    key TEXT NOT NULL UNIQUE,
    value JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Users RLS policies
CREATE POLICY "users_select" ON public.users FOR SELECT USING (
    auth.uid() = auth_user_id OR 
    ((auth.jwt() -> 'app_metadata'->>'role') = 'ADMIN')
);

CREATE POLICY "users_insert" ON public.users FOR INSERT 
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY "users_update" ON public.users FOR UPDATE USING (
    auth.uid() = auth_user_id OR 
    ((auth.jwt() -> 'app_metadata'->>'role') = 'ADMIN')
) WITH CHECK (
    auth.uid() = auth_user_id OR 
    ((auth.jwt() -> 'app_metadata'->>'role') = 'ADMIN')
);

CREATE POLICY "users_delete" ON public.users FOR DELETE USING (
    auth.uid() = auth_user_id OR 
    ((auth.jwt() -> 'app_metadata'->>'role') = 'ADMIN')
);

-- Cases RLS policies
CREATE POLICY "cases_select" ON public.cases FOR SELECT USING (
    ((auth.jwt() -> 'app_metadata'->>'role') = 'ADMIN') OR
    (created_by_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())) OR
    (assigned_judge_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())) OR
    EXISTS (
        SELECT 1 FROM case_participants cp 
        WHERE cp.case_id = cases.id 
        AND cp.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY "cases_insert" ON public.cases FOR INSERT 
WITH CHECK (
    ((auth.jwt() -> 'app_metadata'->>'role') IN ('ATTORNEY', 'CLERK', 'JUDGE', 'PUBLIC'))
);

CREATE POLICY "cases_update" ON public.cases FOR UPDATE USING (
    ((auth.jwt() -> 'app_metadata'->>'role') IN ('ADMIN', 'JUDGE', 'CLERK')) OR
    (created_by_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
);

-- Case participants RLS policies
CREATE POLICY "case_participants_all" ON public.case_participants FOR ALL USING (
    ((auth.jwt() -> 'app_metadata'->>'role') IN ('ADMIN', 'JUDGE', 'CLERK')) OR
    (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
);

-- Hearings RLS policies
CREATE POLICY "hearings_all" ON public.hearings FOR ALL USING (
    ((auth.jwt() -> 'app_metadata'->>'role') IN ('ADMIN', 'JUDGE', 'CLERK')) OR
    EXISTS (
        SELECT 1 FROM case_participants cp 
        WHERE cp.case_id = hearings.case_id 
        AND cp.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
);

-- Documents RLS policies
CREATE POLICY "documents_select" ON public.documents FOR SELECT USING (
    ((auth.jwt() -> 'app_metadata'->>'role') = 'ADMIN') OR
    (uploaded_by_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())) OR
    (visibility = 'PUBLIC') OR
    EXISTS (
        SELECT 1 FROM case_participants cp 
        WHERE cp.case_id = documents.case_id 
        AND cp.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY "documents_insert" ON public.documents FOR INSERT 
WITH CHECK (
    ((auth.jwt() -> 'app_metadata'->>'role') IN ('ATTORNEY', 'CLERK', 'JUDGE', 'PUBLIC'))
);

CREATE POLICY "documents_update" ON public.documents FOR UPDATE USING (
    (uploaded_by_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())) OR
    ((auth.jwt() -> 'app_metadata'->>'role') IN ('JUDGE', 'CLERK'))
);

-- Filings RLS policies
CREATE POLICY "filings_select" ON public.filings FOR SELECT USING (
    ((auth.jwt() -> 'app_metadata'->>'role') = 'ADMIN') OR
    (submitted_by_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())) OR
    EXISTS (
        SELECT 1 FROM case_participants cp 
        WHERE cp.case_id = filings.case_id 
        AND cp.user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY "filings_insert" ON public.filings FOR INSERT 
WITH CHECK (
    ((auth.jwt() -> 'app_metadata'->>'role') IN ('ATTORNEY', 'CLERK', 'JUDGE', 'PUBLIC'))
);

CREATE POLICY "filings_update" ON public.filings FOR UPDATE USING (
    ((auth.jwt() -> 'app_metadata'->>'role') IN ('JUDGE', 'CLERK')) OR
    (submitted_by_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()))
);

-- Notifications RLS policies
CREATE POLICY "notifications_all" ON public.notifications FOR ALL USING (
    user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Audit logs RLS policies
CREATE POLICY "audit_log_select" ON public.audit_log FOR SELECT USING (
    ((auth.jwt() -> 'app_metadata'->>'role') = 'ADMIN')
);

CREATE POLICY "audit_log_insert" ON public.audit_log FOR INSERT 
WITH CHECK (true);

-- System settings RLS policies
CREATE POLICY "system_settings_all" ON public.system_settings FOR ALL USING (
    ((auth.jwt() -> 'app_metadata'->>'role') = 'ADMIN')
);

-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON public.cases
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_hearings_updated_at
    BEFORE UPDATE ON public.hearings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON public.documents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_filings_updated_at
    BEFORE UPDATE ON public.filings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at
    BEFORE UPDATE ON public.system_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, auth_user_id, email, username, role, active)
    VALUES (gen_random_uuid(), NEW.id, NEW.email, split_part(NEW.email,'@',1), 'PUBLIC', true)
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();