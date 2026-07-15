-- Enable public read (SELECT) for active digital IDs, approved profiles, and addresses
-- to allow the public-facing verification page (/verify/[id_number]) to load citizen status.

-- 1. digital_ids public read policy
drop policy if exists "Allow public read for active digital ids" on public.digital_ids;
create policy "Allow public read for active digital ids"
on public.digital_ids
for select
to anon, authenticated
using (status = 'ACTIVE');

-- 2. user_profiles public read policy
drop policy if exists "Allow public read for approved profiles" on public.user_profiles;
create policy "Allow public read for approved profiles"
on public.user_profiles
for select
to anon, authenticated
using (verification_status = 'APPROVED');

-- 3. user_addresses public read policy
drop policy if exists "Allow public read for addresses of approved profiles" on public.user_addresses;
create policy "Allow public read for addresses of approved profiles"
on public.user_addresses
for select
to anon, authenticated
using (
  exists (
    select 1 from public.user_profiles
    where user_profiles.id = user_addresses.user_id
    and user_profiles.verification_status = 'APPROVED'
  )
);
