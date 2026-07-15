-- Enable necessary extensions
create extension if not exists "uuid-ossp";

-- Create user_profiles table
create table public.user_profiles (
    id uuid references auth.users(id) on delete cascade primary key,
    phone text unique not null,
    full_name text,
    birthdate date,
    age integer,
    verification_status text default 'PENDING_ADMIN_REVIEW',
    language_preference text default 'English',
    sms_notifications boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Trigger to sync auth.users with user_profiles
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.user_profiles (id, phone)
  values (new.id, new.phone);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create user_addresses
create table public.user_addresses (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    street text,
    barangay text,
    municipality text,
    province text,
    region text,
    zip_code text,
    latitude float,
    longitude float,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create id_documents
create table public.id_documents (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    id_type text,
    file_url text not null,
    verification_status text default 'PENDING',
    rejection_reason text,
    upload_date timestamptz default now(),
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create digital_ids
create table public.digital_ids (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    id_number text unique not null,
    qr_code_url text,
    issue_date date,
    expiry_date date,
    status text default 'ACTIVE',
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create medicines
create table public.medicines (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    generic_name text,
    description text,
    dosage_strength text,
    unit text,
    usage_instructions text,
    available_quantity integer default 0,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create medicine_requests
create table public.medicine_requests (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    medicine_id uuid references public.medicines(id) on delete cascade not null,
    quantity integer not null,
    reason text,
    prescription_url text,
    status text default 'PENDING',
    pharmacist_notes text,
    request_date timestamptz default now(),
    dispense_date timestamptz,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create admin_users
create table public.admin_users (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text not null,
    role text not null,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create assistance_requests
create table public.assistance_requests (
    id uuid default uuid_generate_v4() primary key,
    user_id uuid references public.user_profiles(id) on delete cascade not null,
    category text not null,
    description text not null,
    urgency_level text default 'Normal',
    address_id uuid references public.user_addresses(id) on delete set null,
    status text default 'PENDING',
    assigned_to uuid references public.admin_users(id) on delete set null,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
);

-- Create admin_logs
create table public.admin_logs (
    id uuid default uuid_generate_v4() primary key,
    admin_id uuid references public.admin_users(id) on delete cascade not null,
    action text not null,
    target_id text,
    target_type text,
    details jsonb,
    status text,
    created_at timestamptz default now()
);

-- Create admin check function (SECURITY DEFINER to bypass RLS for role checks)
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.admin_users 
    where id = auth.uid() and is_active = true
  );
end;
$$ language plpgsql security definer set search_path = public;

-- Enable RLS
alter table public.user_profiles enable row level security;
alter table public.user_addresses enable row level security;
alter table public.id_documents enable row level security;
alter table public.digital_ids enable row level security;
alter table public.medicines enable row level security;
alter table public.medicine_requests enable row level security;
alter table public.assistance_requests enable row level security;
alter table public.admin_users enable row level security;
alter table public.admin_logs enable row level security;

-- user_profiles policies
create policy "Users can view own profile" on public.user_profiles for select to authenticated using (auth.uid() = id);
create policy "Users can update own profile" on public.user_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Admins have full access to user_profiles" on public.user_profiles for all to authenticated using (public.is_admin());

-- user_addresses policies
create policy "Users can view own addresses" on public.user_addresses for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own addresses" on public.user_addresses for insert to authenticated with check (user_id = auth.uid());
create policy "Users can update own addresses" on public.user_addresses for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Admins have full access to user_addresses" on public.user_addresses for all to authenticated using (public.is_admin());

-- id_documents policies
create policy "Users can view own id_documents" on public.id_documents for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own id_documents" on public.id_documents for insert to authenticated with check (user_id = auth.uid());
create policy "Admins have full access to id_documents" on public.id_documents for all to authenticated using (public.is_admin());

-- digital_ids policies
create policy "Users can view own digital_ids" on public.digital_ids for select to authenticated using (user_id = auth.uid());
create policy "Admins have full access to digital_ids" on public.digital_ids for all to authenticated using (public.is_admin());

-- medicines policies
create policy "Authenticated users can view active medicines" on public.medicines for select to authenticated using (is_active = true);
create policy "Admins have full access to medicines" on public.medicines for all to authenticated using (public.is_admin());

-- medicine_requests policies
create policy "Users can view own medicine requests" on public.medicine_requests for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own medicine requests" on public.medicine_requests for insert to authenticated with check (user_id = auth.uid());
create policy "Admins have full access to medicine_requests" on public.medicine_requests for all to authenticated using (public.is_admin());

-- assistance_requests policies
create policy "Users can view own assistance requests" on public.assistance_requests for select to authenticated using (user_id = auth.uid());
create policy "Users can insert own assistance requests" on public.assistance_requests for insert to authenticated with check (user_id = auth.uid());
create policy "Admins have full access to assistance_requests" on public.assistance_requests for all to authenticated using (public.is_admin());

-- admin_users policies
create policy "Users can read own admin status" on public.admin_users for select to authenticated using (auth.uid() = id);
create policy "Admins have full access to admin_users" on public.admin_users for all to authenticated using (public.is_admin());

-- admin_logs policies
create policy "Admins have full access to admin_logs" on public.admin_logs for all to authenticated using (public.is_admin());
