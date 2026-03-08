-- Migration: Setup Trigger to sync Auth Users to Public Users
-- Created at: 2026-01-13
-- Description: Ensures that email changes in Supabase Auth are reflected in the local 'users' table

-- 1. Create the simplified function to handle updates
CREATE OR REPLACE FUNCTION public.handle_user_update_sync()
RETURNS trigger AS $$
BEGIN
  -- Only update if the email has changed
  IF NEW.email IS DISTINCT FROM OLD.email THEN
    UPDATE public.users
    SET 
      email = NEW.email,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Drop existing triggers if any (to be safe)
DROP TRIGGER IF EXISTS on_auth_user_updated_sync ON auth.users;

-- 3. Create the Trigger on auth.users
CREATE TRIGGER on_auth_user_updated_sync
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_update_sync();

-- 4. (Optional) Insert function for self-healing missing users
-- This handles cases where a user is created in Auth but somehow fails to be created in public.users initially
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role, status)
  VALUES (NEW.id, NEW.email, 'agent', 'active')
  ON CONFLICT (id) DO NOTHING; -- If it exists, do nothing (Auth sync loop handled by UPDATE trigger)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Not enabling INSERT trigger by default to avoid conflict with custom registration logic in backend,
-- but the UPDATE trigger is critical for the "Failed to sync" error.
