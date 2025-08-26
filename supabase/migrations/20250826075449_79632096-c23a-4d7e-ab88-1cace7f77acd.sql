-- Update the trigger function to set app_metadata role properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    -- Insert into users table
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

    -- Update app_metadata with the role
    UPDATE auth.users 
    SET app_metadata = COALESCE(app_metadata, '{}'::jsonb) || 
        jsonb_build_object('role', 
            CASE 
                WHEN NEW.email = 'admin@court.gov' THEN 'admin'
                ELSE 'public'
            END
        )
    WHERE id = NEW.id;
    
    RETURN NEW;
END;
$function$;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Update existing admin user's app_metadata
UPDATE auth.users 
SET app_metadata = COALESCE(app_metadata, '{}'::jsonb) || jsonb_build_object('role', 'admin')
WHERE email = 'admin@court.gov';