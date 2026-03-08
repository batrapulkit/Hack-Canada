-- Enable RLS on all core tables
ALTER TABLE public.agencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itineraries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 1. AGENCIES: Users can read their own agency
CREATE POLICY "Users can view their own agency" ON public.agencies
FOR SELECT USING (
  id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
);

-- 2. USERS: Users can read users in their same agency
CREATE POLICY "Users can view members of their agency" ON public.users
FOR SELECT USING (
  agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
);

-- 3. CLIENTS: Isolation by agency_id
CREATE POLICY "Agency isolation for clients" ON public.clients
USING (
  agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
);

-- 4. ITINERARIES: Isolation by agency_id
CREATE POLICY "Agency isolation for itineraries" ON public.itineraries
USING (
  agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
);

-- 5. LEADS: Isolation by agency_id
CREATE POLICY "Agency isolation for leads" ON public.leads
USING (
  agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
);

-- 6. INVOICES: Isolation by agency_id
CREATE POLICY "Agency isolation for invoices" ON public.invoices
USING (
  agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
);

-- 7. BOOKINGS: Isolation by agency_id
CREATE POLICY "Agency isolation for bookings" ON public.bookings
USING (
  agency_id IN (SELECT agency_id FROM public.users WHERE id = auth.uid())
);
