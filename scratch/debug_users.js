const { Client } = require('pg');

const connectionString = "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function debugUsers() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Checking auth.users:");
  const resUsers = await client.query("SELECT id, phone, email FROM auth.users WHERE phone IN ('+639998887771', '+639998887772');");
  console.log(resUsers.rows);

  console.log("Checking public.user_profiles:");
  const resProfiles = await client.query("SELECT id, phone, full_name FROM public.user_profiles WHERE phone IN ('+639998887771', '+639998887772');");
  console.log(resProfiles.rows);

  await client.end();
}

debugUsers().catch(console.error);
