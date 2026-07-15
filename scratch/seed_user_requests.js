const { Client } = require('pg');

const connectionString = "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function seedUserRequests() {
  const client = new Client({ connectionString });
  await client.connect();

  const userId = "b19ae5d8-1e30-4b0a-96bf-e111abd8e740";
  console.log(`Connected to DB. Seeding requests for user: ${userId}...`);

  // Ensure user profile is APPROVED and has a full name
  await client.query(`
    INSERT INTO public.user_profiles (id, phone, full_name, birthdate, age, verification_status, language_preference)
    VALUES (
      '${userId}',
      '+639123456789',
      'John Kevin Lagura',
      '1956-08-20',
      69,
      'APPROVED',
      'English'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      verification_status = 'APPROVED';
  `);

  // Ensure user address exists
  await client.query(`
    INSERT INTO public.user_addresses (user_id, street, barangay, municipality, province, region, zip_code)
    VALUES (
      '${userId}',
      'Poblacion Main St',
      'Santa Cruz',
      'San Luis',
      'Pampanga',
      'Region III',
      '2014'
    )
    ON CONFLICT DO NOTHING;
  `);

  // Delete existing requests for this user to make it fresh and clean
  await client.query(`DELETE FROM public.medicine_requests WHERE user_id = '${userId}';`);
  await client.query(`DELETE FROM public.assistance_requests WHERE user_id = '${userId}';`);

  // Seed Medicine Requests
  await client.query(`
    INSERT INTO public.medicine_requests (user_id, medicine_id, quantity, reason, status)
    VALUES 
    (
      '${userId}', 
      'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', -- Amoxicillin
      21, 
      'Prescribed antibiotic for throat infection.', 
      'PENDING'
    ),
    (
      '${userId}', 
      'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', -- Paracetamol
      10, 
      'Fever and headache relief.', 
      'APPROVED'
    ),
    (
      '${userId}', 
      'cccccccc-cccc-cccc-cccc-cccccccccccc', -- Losartan Potassium
      30, 
      'Daily maintenance medicine for high blood pressure.', 
      'COMPLETED'
    );
  `);

  // Seed Assistance Requests
  await client.query(`
    INSERT INTO public.assistance_requests (user_id, category, description, status)
    VALUES 
    (
      '${userId}', 
      'healthcare', 
      'Requesting free medical transport to local hospital.', 
      'PENDING'
    ),
    (
      '${userId}', 
      'food', 
      'Requesting monthly emergency relief package.', 
      'APPROVED'
    );
  `);

  console.log("Sample requests seeded successfully for John Kevin Lagura!");
  await client.end();
}

seedUserRequests().catch(console.error);
