const { Client } = require('pg');

const connectionString = "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function fixPolicies() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to DB. Updating RLS policy to allow reading all statuses...");

  const sql = `
    -- Drop old active-only policy
    drop policy if exists "Allow public read for active digital ids" on public.digital_ids;
    
    -- Create new policy to allow select on all digital IDs
    drop policy if exists "Allow public read for all digital ids" on public.digital_ids;
    create policy "Allow public read for all digital ids"
    on public.digital_ids
    for select
    to anon, authenticated
    using (true);
  `;

  await client.query(sql);
  console.log("RLS policy updated successfully!");

  await client.end();
}

fixPolicies().catch(console.error);
