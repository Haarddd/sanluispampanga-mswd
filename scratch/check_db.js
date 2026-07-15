const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://wvsrkammvmlbhqdcmfmg.supabase.co";
const supabaseAnonKey = "sb_publishable_ORokJQySmGoGPtyRca5x3w_XScUdcMe";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function check() {
  const idNumber = "342476315";
  console.log("Checking ID:", idNumber);
  
  const { data: digitalId, error } = await supabase
    .from("digital_ids")
    .select(`
      *,
      user_profile:user_profiles (
        full_name,
        verification_status,
        user_addresses (
          street,
          barangay,
          municipality,
          province,
          region,
          zip_code
        )
      )
    `)
    .eq("id_number", idNumber)
    .single();

  if (error) {
    console.error("Error fetching ID:", error);
    return;
  }

  console.log("Result digitalId:", JSON.stringify(digitalId, null, 2));
}

check();
