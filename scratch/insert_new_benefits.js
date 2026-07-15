const { Client } = require('pg');

const connectionString = "postgresql://postgres.wvsrkammvmlbhqdcmfmg:Https%3A%2F%2FHard%3F@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres";

async function insertNewBenefits() {
  const client = new Client({ connectionString });
  await client.connect();

  console.log("Connected to DB. Clearing old benefits and inserting updated benefits list...");

  // Clear existing benefits to reload the fresh list
  await client.query("DELETE FROM public.benefits;");

  const sql = `
    insert into public.benefits (name_en, name_tl, description_en, description_tl, status, details_en, details_tl)
    values
    (
      'Social Pension (SOCPEN)',
      'Sosyal na Pensyon (SOCPEN)',
      '₱1,000 monthly allowance for qualified indigent senior citizens.',
      '₱1,000 buwanang allowance para sa mga kwalipikadong kapus-palad na senior citizen.',
      'active',
      null,
      null
    ),
    (
      'Centenarian & Milestone Cash Gifts',
      'Cash Gifts para sa Centenarian at Milestones',
      '₱10,000 cash gift for reaching ages 80, 85, 90, and 95; ₱100,000 for centenarians (100 years old).',
      '₱10,000 na cash gift para sa mga sumapit sa edad na 80, 85, 90, at 95; ₱100,000 naman para sa mga centenarian (100 taong gulang).',
      'not_in_scope',
      null,
      null
    ),
    (
      'Utility Discounts',
      'Diskwento sa Kuryente at Tubig',
      '5% discount on electricity and water bills for qualified senior citizens.',
      '5% na diskwento sa singil sa kuryente at tubig kung kwalipikado.',
      'eligible',
      null,
      null
    ),
    (
      'PhilHealth',
      'PhilHealth',
      'National health insurance program covering inpatient, outpatient, and emergency care.',
      'Pambansang programa ng seguro sa kalusugan na sumasaklaw sa pagpapagamot sa ospital, outpatient, at emergency care.',
      'active',
      null,
      null
    ),
    (
      'Senior Citizen Discount Card',
      'Senior Citizen Discount Card',
      '20% discount and 12% VAT exemption on medicines, food, transportation, and more.',
      '20% na discount at exemption sa 12% VAT sa mga gamot, pagkain, pamasahe, at iba pa.',
      'active',
      null,
      null
    );
  `;

  await client.query(sql);
  console.log("Updated benefits list successfully inserted into database!");

  await client.end();
}

insertNewBenefits().catch(console.error);
