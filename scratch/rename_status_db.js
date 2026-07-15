const { Client } = require('pg');

const connectionString = "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function renameStatus() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to DB. Updating status 'REVOKED' to 'SUSPENDED'...");
  const res = await client.query("UPDATE public.digital_ids SET status = 'SUSPENDED' WHERE status = 'REVOKED';");
  console.log("Updated rows count:", res.rowCount);

  await client.end();
}

renameStatus().catch(console.error);
