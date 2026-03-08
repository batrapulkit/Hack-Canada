-- Create a secure function to get the current user's agency_id without triggering RLS recursively
CREATE OR REPLACE FUNCTION public.get_auth_user_agency_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_agency_id UUID;
BEGIN
    SELECT agency_id INTO v_agency_id
    FROM public.users
    WHERE id = auth.uid();
    
    RETURN v_agency_id;
END;
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view members of their agency" ON public.users;
DROP POLICY IF EXISTS "Agency isolation for clients" ON public.clients;
DROP POLICY IF EXISTS "Agency isolation for itineraries" ON public.itineraries;
DROP POLICY IF EXISTS "Agency isolation for leads" ON public.leads;
DROP POLICY IF EXISTS "Agency isolation for invoices" ON public.invoices;
DROP POLICY IF EXISTS "Agency isolation for bookings" ON public.bookings;
DROP POLICY IF EXISTS "Agency Access Policy" ON public.itinerary_items;

-- Re-create policies using the secure function

-- USERS
CREATE POLICY "Users can view members of their agency" ON public.users
FOR SELECT USING (
  agency_id = get_auth_user_agency_id() 
  OR id = auth.uid() -- explicit self-access just in case
);

-- CLIENTS
CREATE POLICY "Agency isolation for clients" ON public.clients
USING (
  agency_id = get_auth_user_agency_id()
);

-- ITINERARIES
CREATE POLICY "Agency isolation for itineraries" ON public.itineraries
USING (
  agency_id = get_auth_user_agency_id()
);

-- LEADS
CREATE POLICY "Agency isolation for leads" ON public.leads
USING (
  agency_id = get_auth_user_agency_id()
);

-- INVOICES
CREATE POLICY "Agency isolation for invoices" ON public.invoices
USING (
  agency_id = get_auth_user_agency_id()
);

-- BOOKINGS
CREATE POLICY "Agency isolation for bookings" ON public.bookings
USING (
  agency_id = get_auth_user_agency_id()
);

-- ITINERARY ITEMS
CREATE POLICY "Agency Access Policy" ON public.itinerary_items
USING (
  agency_id = get_auth_user_agency_id()
)
WITH CHECK (
  agency_id = get_auth_user_agency_id()
);

-- AGENCIES (fix this one too just in case)
DROP POLICY IF EXISTS "Users can view their own agency" ON public.agencies;
CREATE POLICY "Users can view their own agency" ON public.agencies
FOR SELECT USING (
  id = get_auth_user_agency_id()
);

-- SUPPLIERS (Also fix suppliers if it exists, based on previous Context)
-- Checking previous files, suppliers table exists.
DROP POLICY IF EXISTS "Enable read access for users based on agency_id" ON public.suppliers;
DROP POLICY IF EXISTS "Enable insert access for users based on agency_id" ON public.suppliers;
DROP POLICY IF EXISTS "Enable update access for users based on agency_id" ON public.suppliers;
DROP POLICY IF EXISTS "Enable delete access for users based on agency_id" ON public.suppliers;
-- Also check for generic naming
DROP POLICY IF EXISTS "Agency isolation for suppliers" ON public.suppliers;

CREATE POLICY "Agency isolation for suppliers" ON public.suppliers
USING (
  agency_id = get_auth_user_agency_id()
);
