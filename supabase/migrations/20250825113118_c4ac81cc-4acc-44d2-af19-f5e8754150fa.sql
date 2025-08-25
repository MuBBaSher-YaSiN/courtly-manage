-- Court Management System Database Schema

-- First, create the enum types
CREATE TYPE public.user_role AS ENUM ('ADMIN', 'JUDGE', 'ATTORNEY', 'CLERK', 'PUBLIC');
CREATE TYPE public.case_status AS ENUM ('FILED', 'ACTIVE', 'PENDING', 'CLOSED', 'DISMISSED');
CREATE TYPE public.case_type AS ENUM ('CIVIL', 'CRIMINAL', 'FAMILY', 'TRAFFIC', 'PROBATE');
CREATE TYPE public.case_priority AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE public.participant_role AS ENUM ('PLAINTIFF', 'DEFENDANT', 'ATTORNEY', 'WITNESS', 'EXPERT');
CREATE TYPE public.filing_type AS ENUM ('MOTION', 'BRIEF', 'COMPLAINT', 'ANSWER', 'DISCOVERY', 'ORDER');
CREATE TYPE public.filing_status AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED');
CREATE TYPE public.document_visibility AS ENUM ('PUBLIC', 'PRIVATE', 'RESTRICTED');
CREATE TYPE public.hearing_status AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'POSTPONED');
CREATE TYPE public.audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'APPROVE', 'REJECT');

-- Create the main tables

-- Users table (links to auth.users)
CREATE TABLE public.users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    auth_user_id uuid UNIQUE NOT NULL,
    email text NOT NULL,
    username text NOT NULL,
    role user_role NOT NULL DEFAULT 'PUBLIC',
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Cases table
CREATE TABLE public.cases (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_number text UNIQUE NOT NULL,
    title text NOT NULL,
    type case_type NOT NULL,
    status case_status NOT NULL DEFAULT 'FILED',
    priority case_priority NOT NULL DEFAULT 'NORMAL',
    created_by_id uuid NOT NULL REFERENCES public.users(id),
    assigned_judge_id uuid REFERENCES public.users(id),
    filed_at timestamp with time zone DEFAULT now() NOT NULL,
    closed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Case participants table
CREATE TABLE public.case_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.users(id),
    role_in_case participant_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    UNIQUE(case_id, user_id, role_in_case)
);

-- Filings table
CREATE TABLE public.filings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    submitted_by_id uuid NOT NULL REFERENCES public.users(id),
    filing_type filing_type NOT NULL,
    description text NOT NULL,
    submitted_at timestamp with time zone DEFAULT now() NOT NULL,
    status filing_status NOT NULL DEFAULT 'SUBMITTED',
    reviewed_by_id uuid REFERENCES public.users(id),
    review_notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Documents table
CREATE TABLE public.documents (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    uploaded_by_id uuid NOT NULL REFERENCES public.users(id),
    original_name text NOT NULL,
    mime_type text NOT NULL,
    size bigint NOT NULL,
    storage_key text NOT NULL,
    visibility document_visibility NOT NULL DEFAULT 'PRIVATE',
    uploaded_at timestamp with time zone DEFAULT now() NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Hearings table
CREATE TABLE public.hearings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id uuid NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
    start_at timestamp with time zone NOT NULL,
    end_at timestamp with time zone NOT NULL,
    courtroom text NOT NULL,
    status hearing_status NOT NULL DEFAULT 'SCHEDULED',
    created_by_id uuid NOT NULL REFERENCES public.users(id),
    notes text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Audit log table
CREATE TABLE public.audit_log (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id uuid REFERENCES public.users(id),
    action audit_action NOT NULL,
    entity_type text NOT NULL,
    entity_id uuid NOT NULL,
    timestamp timestamp with time zone DEFAULT now() NOT NULL,
    meta jsonb DEFAULT '{}'::jsonb
);

-- System settings table
CREATE TABLE public.system_settings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    key text UNIQUE NOT NULL,
    value jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_users_auth_user_id ON public.users(auth_user_id);
CREATE INDEX idx_cases_case_number ON public.cases(case_number);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_created_by ON public.cases(created_by_id);
CREATE INDEX idx_cases_assigned_judge ON public.cases(assigned_judge_id);
CREATE INDEX idx_cases_filed_at ON public.cases(filed_at);
CREATE INDEX idx_case_participants_case_id ON public.case_participants(case_id);
CREATE INDEX idx_case_participants_user_id ON public.case_participants(user_id);
CREATE INDEX idx_filings_case_id ON public.filings(case_id);
CREATE INDEX idx_filings_submitted_by ON public.filings(submitted_by_id);
CREATE INDEX idx_filings_status ON public.filings(status);
CREATE INDEX idx_documents_case_id ON public.documents(case_id);
CREATE INDEX idx_documents_uploaded_by ON public.documents(uploaded_by_id);
CREATE INDEX idx_hearings_case_id ON public.hearings(case_id);
CREATE INDEX idx_hearings_start_at ON public.hearings(start_at);
CREATE INDEX idx_audit_log_actor_id ON public.audit_log(actor_id);
CREATE INDEX idx_audit_log_timestamp ON public.audit_log(timestamp);
CREATE INDEX idx_audit_log_entity ON public.audit_log(entity_type, entity_id);

-- GIN indexes for search functionality
CREATE INDEX idx_cases_search ON public.cases USING gin(to_tsvector('english', title || ' ' || case_number));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_cases_updated_at BEFORE UPDATE ON public.cases FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_filings_updated_at BEFORE UPDATE ON public.filings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON public.documents FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_hearings_updated_at BEFORE UPDATE ON public.hearings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_system_settings_updated_at BEFORE UPDATE ON public.system_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Link column constraint for users table (auth_user_id)
ALTER TABLE public.users
    ADD CONSTRAINT users_auth_user_id_key UNIQUE (auth_user_id);

-- Drop any existing policies to avoid recursion issues
DO $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT policyname FROM pg_policies
        WHERE schemaname='public' AND tablename='users'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.users', r.policyname);
    END LOOP;
END$$;

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hearings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table (non-recursive using JWT only)
CREATE POLICY users_insert ON public.users
FOR INSERT
WITH CHECK (auth.uid() = auth_user_id);

CREATE POLICY users_select ON public.users
FOR SELECT
USING (
    auth.uid() = auth_user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
);

CREATE POLICY users_update ON public.users
FOR UPDATE
USING (
    auth.uid() = auth_user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
)
WITH CHECK (
    auth.uid() = auth_user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
);

CREATE POLICY users_delete ON public.users
FOR DELETE
USING (
    auth.uid() = auth_user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
);

-- RLS Policies for cases table
CREATE POLICY cases_select ON public.cases
FOR SELECT
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
    OR created_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR assigned_judge_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.case_participants cp
        WHERE cp.case_id = cases.id 
        AND cp.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY cases_insert ON public.cases
FOR INSERT
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ATTORNEY', 'CLERK', 'JUDGE', 'PUBLIC')
);

CREATE POLICY cases_update ON public.cases
FOR UPDATE
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'JUDGE', 'CLERK')
    OR created_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

-- RLS Policies for documents table (Admin cannot upload case documents)
CREATE POLICY documents_select ON public.documents
FOR SELECT
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
    OR uploaded_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR visibility = 'PUBLIC'
    OR EXISTS (
        SELECT 1 FROM public.case_participants cp
        WHERE cp.case_id = documents.case_id 
        AND cp.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY documents_insert ON public.documents
FOR INSERT
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ATTORNEY', 'CLERK', 'JUDGE', 'PUBLIC')
);

CREATE POLICY documents_update ON public.documents
FOR UPDATE
USING (
    uploaded_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR (auth.jwt() -> 'app_metadata' ->> 'role') IN ('JUDGE', 'CLERK')
);

-- RLS Policies for other tables
CREATE POLICY case_participants_all ON public.case_participants
FOR ALL
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'JUDGE', 'CLERK')
    OR user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

CREATE POLICY filings_select ON public.filings
FOR SELECT
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
    OR submitted_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    OR EXISTS (
        SELECT 1 FROM public.case_participants cp
        WHERE cp.case_id = filings.case_id 
        AND cp.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY filings_insert ON public.filings
FOR INSERT
WITH CHECK (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ATTORNEY', 'CLERK', 'JUDGE', 'PUBLIC')
);

CREATE POLICY filings_update ON public.filings
FOR UPDATE
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('JUDGE', 'CLERK')
    OR submitted_by_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
);

CREATE POLICY hearings_all ON public.hearings
FOR ALL
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') IN ('ADMIN', 'JUDGE', 'CLERK')
    OR EXISTS (
        SELECT 1 FROM public.case_participants cp
        WHERE cp.case_id = hearings.case_id 
        AND cp.user_id = (SELECT id FROM public.users WHERE auth_user_id = auth.uid())
    )
);

CREATE POLICY audit_log_select ON public.audit_log
FOR SELECT
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

CREATE POLICY audit_log_insert ON public.audit_log
FOR INSERT
WITH CHECK (true);

CREATE POLICY system_settings_all ON public.system_settings
FOR ALL
USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN');

-- Auto-profile trigger (creates public.users row when auth.users is created)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY definer
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.users (id, auth_user_id, email, username, role, active)
    VALUES (gen_random_uuid(), NEW.id, NEW.email, split_part(NEW.email,'@',1), 'PUBLIC', true)
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default system settings
INSERT INTO public.system_settings (key, value) VALUES
('max_file_size', '26214400'),
('allowed_file_types', '["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "image/png", "image/jpeg"]'),
('court_name', '"Superior Court"');