-- Create function to check if user exists and onboarding is complete by phone number
create or replace function public.check_user_exists_by_phone(phone_number text)
returns boolean as $$
begin
  return exists (
    select 1 from public.user_profiles
    where phone = phone_number and full_name is not null
  );
end;
$$ language plpgsql security definer set search_path = public;
