-- Fix RLS policies for admin access to prevent infinite loading

-- USERS: Allow admin to read all users
DROP POLICY IF EXISTS "users_select" ON public.users;
CREATE POLICY "users_select_admin_all" 
ON public.users 
FOR SELECT 
TO authenticated
USING (
  ((auth.jwt() -> 'app_metadata'::text) ->> 'role'::text)::text = 'admin'::text
  OR auth.uid() = auth_user_id
);

-- SYSTEM SETTINGS: Allow admin full access
DROP POLICY IF EXISTS "system_settings_all" ON public.system_settings;
CREATE POLICY "admin_settings_select" 
ON public.system_settings 
FOR SELECT 
TO authenticated
USING (
  (SELECT role::text FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'::text
);

CREATE POLICY "admin_settings_insert" 
ON public.system_settings 
FOR INSERT 
TO authenticated
WITH CHECK (
  (SELECT role::text FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'::text
);

CREATE POLICY "admin_settings_update" 
ON public.system_settings 
FOR UPDATE 
TO authenticated
USING (
  (SELECT role::text FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'::text
)
WITH CHECK (
  (SELECT role::text FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'::text
);

CREATE POLICY "admin_settings_delete" 
ON public.system_settings 
FOR DELETE 
TO authenticated
USING (
  (SELECT role::text FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'::text
);

-- AUDIT LOG: Allow admin to read audit logs
DROP POLICY IF EXISTS "audit_log_select" ON public.audit_log;
CREATE POLICY "admin_audit_select" 
ON public.audit_log 
FOR SELECT 
TO authenticated
USING (
  (SELECT role::text FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'::text
);

-- Update users policy to allow admin to update other users
DROP POLICY IF EXISTS "users_update" ON public.users;
CREATE POLICY "users_update_self_or_admin" 
ON public.users 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() = auth_user_id 
  OR (SELECT role::text FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'::text
)
WITH CHECK (
  auth.uid() = auth_user_id 
  OR (SELECT role::text FROM public.users WHERE auth_user_id = auth.uid()) = 'admin'::text
);