const { Client } = require('pg');

const connectionString = "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function check() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to DB. Querying digital_ids...");
  const resIds = await client.query("SELECT * FROM public.digital_ids;");
  console.log("Digital IDs in Postgres:", resIds.rows);

  console.log("Querying user_profiles...");
  const resProfiles = await client.query("SELECT * FROM public.user_profiles;");
  console.log("User Profiles in Postgres:", resProfiles.rows);

  await client.end();
}

check().catch(console.error);
