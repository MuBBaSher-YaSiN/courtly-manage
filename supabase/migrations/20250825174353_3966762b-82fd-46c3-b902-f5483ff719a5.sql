-- Fix the trigger to properly handle new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create proper trigger for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
    -- Insert into users table with proper role detection
    INSERT INTO public.users (id, auth_user_id, email, username, role, active)
    VALUES (
        gen_random_uuid(), 
        NEW.id, 
        NEW.email, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email,'@',1)),
        CASE 
            WHEN NEW.email = 'admin@court.gov' THEN 'ADMIN'::user_role
            WHEN NEW.email = 'judge@example.com' THEN 'JUDGE'::user_role  
            WHEN NEW.email = 'attorney@example.com' THEN 'ATTORNEY'::user_role
            WHEN NEW.email = 'clerk@example.com' THEN 'CLERK'::user_role
            ELSE 'PUBLIC'::user_role
        END,
        true
    )
    ON CONFLICT (auth_user_id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Delete existing demo users from users table since they don't exist in auth
DELETE FROM users WHERE auth_user_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222', 
    '33333333-3333-3333-3333-333333333333',
    '44444444-4444-4444-4444-444444444444'
);