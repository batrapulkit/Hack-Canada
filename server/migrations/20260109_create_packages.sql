-- Create Packages Table
create table if not exists public.packages (
  id uuid default gen_random_uuid() primary key,
  resort_id uuid references public.resorts(id) on delete cascade not null,
  name text not null,
  description text,
  price decimal(10,2) not null,
  currency text default 'USD',
  duration_days int default 7,
  inclusions jsonb default '[]'::jsonb, -- Array of strings e.g. ["Flight", "All-Inclusive"]
  valid_from date,
  valid_until date,
  image_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Indexes
create index idx_packages_resort_id on public.packages(resort_id);

-- Enable RLS
alter table public.packages enable row level security;

-- Policies (Public Read, Auth Write)
create policy "Public packages are viewable by everyone." on public.packages for select using (true);
create policy "Authenticated users can insert packages." on public.packages for insert with check (auth.role() = 'authenticated');
create policy "Authenticated users can update packages." on public.packages for update using (auth.role() = 'authenticated');
create policy "Authenticated users can delete packages." on public.packages for delete using (auth.role() = 'authenticated');
