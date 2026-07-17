-- Add new onboarding fields to user_profiles
alter table public.user_profiles 
add column if not exists sex text,
add column if not exists civil_status text,
add column if not exists emergency_contact_name text,
add column if not exists emergency_contact_number text;
