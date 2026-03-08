-- Create the suppliers table
create table public.suppliers (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone null,
  name text not null,
  type text null,
  email text null,
  region text null,
  website_url text null,
  logo_url text null,
  notes text null,
  is_active boolean null default true,
  api_config jsonb null default '{}'::jsonb,
  agency_id uuid not null,
  constraint suppliers_pkey primary key (id),
  constraint suppliers_agency_id_fkey foreign key (agency_id) references agencies (id) on delete cascade
) tablespace pg_default;

-- Enable Row Level Security
alter table public.suppliers enable row level security;

-- Create policies
create policy "Enable read access for users based on agency_id" on public.suppliers
  as permissive for select
  to authenticated
  using ((auth.uid() in ( select profiles.id from profiles where (profiles.agency_id = suppliers.agency_id) )));

create policy "Enable insert access for users based on agency_id" on public.suppliers
  as permissive for insert
  to authenticated
  with check ((auth.uid() in ( select profiles.id from profiles where (profiles.agency_id = suppliers.agency_id) )));

create policy "Enable update access for users based on agency_id" on public.suppliers
  as permissive for update
  to authenticated
  using ((auth.uid() in ( select profiles.id from profiles where (profiles.agency_id = suppliers.agency_id) )));

create policy "Enable delete access for users based on agency_id" on public.suppliers
  as permissive for delete
  to authenticated
  using ((auth.uid() in ( select profiles.id from profiles where (profiles.agency_id = suppliers.agency_id) )));
