-- Add email and login_password columns to public.admin_users
alter table public.admin_users add column if not exists email text;
alter table public.admin_users add column if not exists login_password text;

-- Unique email constraint on admin_users
alter table public.admin_users drop constraint if exists admin_users_email_key;
alter table public.admin_users add constraint admin_users_email_key unique (email);

-- Trigger function to automatically sync admin changes (email and password) to auth.users
create or replace function public.sync_admin_to_auth()
returns trigger as $$
begin
  -- If id is null, generate one
  if new.id is null then
    new.id := gen_random_uuid();
  end if;

  -- Create or update auth.users
  if exists (select 1 from auth.users where id = new.id) then
    update auth.users
    set 
      email = new.email,
      encrypted_password = extensions.crypt(new.login_password, extensions.gen_salt('bf', 10)),
      email_confirmed_at = now()
    where id = new.id;
  else
    insert into auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      is_super_admin,
      role,
      created_at,
      updated_at
    )
    values (
      new.id,
      '00000000-0000-0000-0000-000000000000',
      new.email,
      extensions.crypt(new.login_password, extensions.gen_salt('bf', 10)),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      false,
      'authenticated',
      now(),
      now()
    );
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public, extensions;

-- Recreate trigger
drop trigger if exists on_admin_user_inserted_updated on public.admin_users;
create trigger on_admin_user_inserted_updated
  before insert or update on public.admin_users
  for each row execute procedure public.sync_admin_to_auth();
