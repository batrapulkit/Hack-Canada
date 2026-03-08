-- Fix recursion in RLS policies by using a SECURITY DEFINER function

-- 1. Create helper function to get agency_id without triggering RLS
-- We use SECURITY DEFINER so it runs with the privileges of the creator (usually postgres/superuser)
-- ignoring the RLS on the users table for this specific lookup.
CREATE OR REPLACE FUNCTION public.get_auth_agency_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT agency_id FROM public.users WHERE id = auth.uid()
$$;

-- 2. Drop potentially recursive user policies
DROP POLICY IF EXISTS "Users can view members of their agency" ON public.users;
DROP POLICY IF EXISTS "Users can view their own agency" ON public.users; -- Clean up if needed

-- 3. Create new user policy specific for self-viewing (non-recursive optimization)
CREATE POLICY "Users can view self" ON public.users
FOR SELECT USING (
  id = auth.uid()
);

-- 4. Create new user policy for viewing agency members (using helper)
CREATE POLICY "Users can view agency members" ON public.users
FOR SELECT USING (
  agency_id = get_auth_agency_id()
);

-- 5. Update other policies to use the helper function to be safe and efficient
-- Itineraries
DROP POLICY IF EXISTS "Agency isolation for itineraries" ON public.itineraries;
CREATE POLICY "Agency isolation for itineraries" ON public.itineraries
USING (
  agency_id = get_auth_agency_id()
);

-- Clients
DROP POLICY IF EXISTS "Agency isolation for clients" ON public.clients;
CREATE POLICY "Agency isolation for clients" ON public.clients
USING (
  agency_id = get_auth_agency_id()
);

-- Bookings
DROP POLICY IF EXISTS "Agency isolation for bookings" ON public.bookings;
CREATE POLICY "Agency isolation for bookings" ON public.bookings
USING (
  agency_id = get_auth_agency_id()
);

-- Invoices
DROP POLICY IF EXISTS "Agency isolation for invoices" ON public.invoices;
CREATE POLICY "Agency isolation for invoices" ON public.invoices
USING (
  agency_id = get_auth_agency_id()
);
