-- Add login_pin column to user_profiles table so admins/staff can view/edit it
alter table public.user_profiles add column if not exists login_pin text;

-- Update the check_user_exists_by_phone function to verify that they have a profile AND a pin set
create or replace function public.check_user_exists_by_phone(phone_number text)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_profiles
    where phone = phone_number and full_name is not null and login_pin is not null
  );
end;
$$ language plpgsql security definer set search_path = public;
