-- Trigger function to automatically sync profile changes (PIN and Phone) to auth.users
create or replace function public.sync_profile_pin_to_auth()
returns trigger as $$
begin
  -- Sync virtual email and encrypted password when login_pin is updated/inserted
  if new.login_pin is not null and (old.login_pin is null or new.login_pin <> old.login_pin) then
    update auth.users
    set 
      email = concat(new.phone, '@phone.system'),
      encrypted_password = crypt(new.login_pin, gen_salt('bf', 10)),
      email_confirmed_at = now()
    where id = new.id;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Drop trigger if exists
drop trigger if exists on_profile_pin_updated on public.user_profiles;

-- Create the trigger
create trigger on_profile_pin_updated
  after update on public.user_profiles
  for each row execute procedure public.sync_profile_pin_to_auth();
