const { Client } = require('pg');

const connectionString = "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function enableRealtime() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to DB. Enabling Realtime for announcements and benefits...");

  const sql = `
    -- Enable realtime for announcements and benefits tables
    begin;
      -- Ensure publication exists (it always does in Supabase, but just in case)
      create committees if not exists supabase_realtime; 
      
      -- Add tables to the supabase_realtime publication
      alter publication supabase_realtime add table public.announcements;
      alter publication supabase_realtime add table public.benefits;
    commit;
  `;

  try {
    await client.query(sql);
    console.log("Realtime publication updated successfully!");
  } catch (error) {
    // If they were already added, it might throw an error. Let's handle it safely.
    if (error.message.includes("already exists")) {
      console.log("Tables are already in the publication.");
    } else {
      // Attempt separate statements in case of existing membership
      console.log("Encountered error, trying individual alter statements...");
      try {
        await client.query("alter publication supabase_realtime add table public.announcements;");
        console.log("Announcements added.");
      } catch (e) {
        console.log("Announcements alter info:", e.message);
      }
      try {
        await client.query("alter publication supabase_realtime add table public.benefits;");
        console.log("Benefits added.");
      } catch (e) {
        console.log("Benefits alter info:", e.message);
      }
    }
  }

  await client.end();
}

enableRealtime().catch(console.error);
