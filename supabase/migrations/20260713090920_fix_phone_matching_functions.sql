-- Fix check_user_exists_by_phone to handle + prefix in parameters
create or replace function public.check_user_exists_by_phone(phone_number text)
returns boolean
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  return exists (
    select 1 from public.user_profiles
    where phone = replace(phone_number, '+', '')
      and full_name is not null
      and login_pin is not null
  );
end;
$$;

-- Fix get_user_pin_by_phone to handle + prefix in parameters
create or replace function public.get_user_pin_by_phone(phone_number text)
returns table(login_pin text, full_name text)
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  return query
  select u.login_pin, u.full_name from public.user_profiles u
  where u.phone = replace(phone_number, '+', '');
end;
$$;
