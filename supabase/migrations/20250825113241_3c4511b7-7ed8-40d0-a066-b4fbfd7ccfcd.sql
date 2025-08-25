-- Fix security warning: Function Search Path Mutable
-- Update functions to have immutable search_path

-- Drop and recreate the updated_at function with proper search_path
DROP FUNCTION IF EXISTS public.update_updated_at_column();
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

-- The handle_new_user function already has SET search_path = public, so it's okay