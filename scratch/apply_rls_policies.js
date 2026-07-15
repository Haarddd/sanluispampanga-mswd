const { Client } = require('pg');

const connectionString = "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function applyPolicies() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to DB. Applying RLS policies...");

  const sql = `
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
  `;

  await client.query(sql);
  console.log("RLS policies applied successfully!");

  await client.end();
}

applyPolicies().catch(console.error);
