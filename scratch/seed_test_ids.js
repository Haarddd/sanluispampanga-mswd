const { Client } = require("pg");

const connectionString =
  "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function createFakeData() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to DB. Inserting auth users and fake data...");

  const sql = `
    -- Revoked Citizen User
    INSERT INTO auth.users (id, phone, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
    VALUES (
      'c0000000-0000-0000-0000-000000000009',
      '+639998887771',
      '$2a$10$7/l3Yy.8E77pE4gq5u4R/.xNle4o7D03sP0W2/XhO1oZ7d1vQWJ/y', -- dummy crypted password
      now(),
      '{"provider":"phone","providers":["phone"]}',
      '{}',
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Expired Citizen User
    INSERT INTO auth.users (id, phone, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, role)
    VALUES (
      'c0000000-0000-0000-0000-000000000010',
      '+639998887772',
      '$2a$10$7/l3Yy.8E77pE4gq5u4R/.xNle4o7D03sP0W2/XhO1oZ7d1vQWJ/y', -- dummy crypted password
      now(),
      '{"provider":"phone","providers":["phone"]}',
      '{}',
      false,
      'authenticated'
    )
    ON CONFLICT (id) DO NOTHING;

    -- Revoked Citizen Profile
    INSERT INTO public.user_profiles (id, phone, full_name, birthdate, age, verification_status, language_preference)
    VALUES (
      'c0000000-0000-0000-0000-000000000009',
      '+639998887771',
      'Melchora Aquino (Suspended)',
      '1950-01-06',
      76,
      'APPROVED',
      'Tagalog'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      verification_status = EXCLUDED.verification_status;

    INSERT INTO public.user_addresses (user_id, street, barangay, municipality, province, zip_code)
    VALUES (
      'c0000000-0000-0000-0000-000000000009',
      'Banlat Road',
      'Tandang Sora',
      'San Luis',
      'Pampanga',
      '2014'
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.digital_ids (user_id, id_number, qr_code_url, issue_date, expiry_date, status)
    VALUES (
      'c0000000-0000-0000-0000-000000000009',
      '888000111',
      '888000111',
      '2026-01-01',
      '2031-01-01',
      'SUSPENDED'
    )
    ON CONFLICT (id_number) DO UPDATE SET
      status = 'SUSPENDED';

    -- Expired Citizen Profile
    INSERT INTO public.user_profiles (id, phone, full_name, birthdate, age, verification_status, language_preference)
    VALUES (
      'c0000000-0000-0000-0000-000000000010',
      '+639998887772',
      'Macario Sakay',
      '1952-03-01',
      74,
      'APPROVED',
      'English'
    )
    ON CONFLICT (id) DO UPDATE SET
      full_name = EXCLUDED.full_name,
      verification_status = EXCLUDED.verification_status;

    INSERT INTO public.user_addresses (user_id, street, barangay, municipality, province, zip_code)
    VALUES (
      'c0000000-0000-0000-0000-000000000010',
      'Rizal Ave',
      'San Isidro',
      'San Luis',
      'Pampanga',
      '2014'
    )
    ON CONFLICT DO NOTHING;

    INSERT INTO public.digital_ids (user_id, id_number, qr_code_url, issue_date, expiry_date, status)
    VALUES (
      'c0000000-0000-0000-0000-000000000010',
      '999000222',
      '999000222',
      '2020-01-01',
      '2025-01-01',
      'EXPIRED'
    )
    ON CONFLICT (id_number) DO UPDATE SET
      status = 'EXPIRED';
  `;

  await client.query(sql);
  console.log("Fake data inserted successfully!");

  await client.end();
}

createFakeData().catch(console.error);
