const { Client } = require('pg');

const connectionString = "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function applySchema() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to DB. Creating announcements and benefits tables...");

  const sql = `
    -- Drop tables if they already exist (to be safe)
    drop table if exists public.announcements cascade;
    drop table if exists public.benefits cascade;

    -- Create announcements table
    create table public.announcements (
        id uuid default uuid_generate_v4() primary key,
        title_en text not null,
        title_tl text,
        description_en text not null,
        description_tl text,
        created_at timestamptz default now()
    );

    -- Create benefits table
    create table public.benefits (
        id uuid default uuid_generate_v4() primary key,
        name_en text not null,
        name_tl text,
        description_en text not null,
        description_tl text,
        status text default 'active', -- active, eligible, pending
        details_en text,
        details_tl text,
        created_at timestamptz default now()
    );

    -- Enable RLS
    alter table public.announcements enable row level security;
    alter table public.benefits enable row level security;

    -- Policies for announcements
    create policy "Anyone can view announcements" on public.announcements for select using (true);
    create policy "Admins have full access to announcements" on public.announcements for all to authenticated using (public.is_admin());

    -- Policies for benefits
    create policy "Anyone can view benefits" on public.benefits for select using (true);
    create policy "Admins have full access to benefits" on public.benefits for all to authenticated using (public.is_admin());

    -- Seed announcements
    insert into public.announcements (title_en, title_tl, description_en, description_tl)
    values 
    ('Pension Release Schedule Update', 'Iskedyul ng Pag-release ng Pension', 'The monthly pension for senior citizens will be released on July 15-17 at the Municipal Hall from 8:00 AM to 3:00 PM. Please bring your Senior Citizen ID and a photocopy of it.', 'Ang buwanang pension para sa mga senior citizen ay ipapamahagi sa Hulyo 15-17 sa Municipal Hall mula 8:00 AM hanggang 3:00 PM. Mangyaring dalhin ang inyong Senior Citizen ID at isang photocopy nito.'),
    ('Free Medical Check-up', 'Libreng Check-up sa Kalusugan', 'Free medical and dental check-up for registered senior citizens at the Barangay Health Center. Includes free blood sugar testing and distribution of basic vitamins.', 'Libreng check-up sa medikal at dental para sa mga rehistradong senior citizen sa Barangay Health Center. May kasama ring libreng pagsusuri ng blood sugar at pamimigay ng mga pangunahing bitamina.'),
    ('Emergency Food Pack Distribution', 'Pamamahagi ng Ayuda (Food Pack)', 'There will be a food pack distribution program for all registered senior citizens at the barangay covered court. Please present your digital or physical ID card.', 'Magkakaroon ng pamamahagi ng food pack para sa lahat ng rehistradong senior citizen sa barangay covered court. Dalhin lamang ang inyong digital o pisikal na ID card.'),
    ('Free Movie Admission Policy Updated', 'Polisiya sa Libreng Sine para sa mga Senior', 'Senior Citizen IDs can now be used for free movie admission at participating cinemas every Monday and Tuesday. Please follow local cinema scheduling guidelines.', 'Maaari nang gamitim ang Senior Citizen ID para sa libreng panonood ng sine sa mga nakatalagang sinehan tuwing Lunes at Martes. Sumunod lamang sa alituntunin ng sinehan.');

    -- Seed benefits
    insert into public.benefits (name_en, name_tl, description_en, description_tl, status, details_en, details_tl)
    values
    ('PhilHealth', 'PhilHealth', 'National health insurance program covering inpatient, outpatient, and emergency care.', 'Pambansang programa ng seguro sa kalusugan na sumasaklaw sa pagpapagamot sa ospital, outpatient, at emergency care.', 'active', 'Member since 2019 · Auto-renewed annually', 'Miyembro mula noong 2019 · Awtomatikong nire-renew taon-taon'),
    ('SSS Pension', 'SSS Pension', 'Monthly pension benefit from the Social Security System for qualified retirees.', 'Buwanang benepisyo sa pension mula sa Social Security System para sa mga kwalipikadong retirado.', 'eligible', 'Claim period: July 1–30, 2026', 'Araw ng pag-claim: Hulyo 1–30, 2026'),
    ('DSWD Social Pension', 'DSWD Social Pension', '₱500/month stipend for indigent senior citizens aged 60 and above.', '₱500/buwan na tulong pinansyal para sa mga kapus-palad na senior citizen na may edad 60 pataas.', 'pending', 'Application submitted June 15, 2026', 'Ipinadala noong Hunyo 15, 2026'),
    ('Senior Citizen Discount Card', 'Senior Citizen Discount Card', '20% discount and 12% VAT exemption on medicines, food, transportation, and more.', '20% na discount at exemption sa 12% VAT sa mga gamot, pagkain, pamasahe, at iba pa.', 'active', 'Valid until December 2027', 'Wasto hanggang Disyembre 2027');
  `;

  await client.query(sql);
  console.log("Announcements and benefits schema applied and seeded successfully!");

  await client.end();
}

applySchema().catch(console.error);
