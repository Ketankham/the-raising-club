// Persistent demo published family listings for Connect Families (slide 3).
//   node --env-file=.env.local scripts/seed-marketplace-families.mjs
import pg from "pg";
import crypto from "node:crypto";
const c = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await c.connect();
const q = (t, p) => c.query(t, p);
const pw = process.env.TEST_PASSWORD ?? "TestPass#2026";
async function mkUser(email) {
  await q("delete from auth.users where email=$1", [email]);
  const id = crypto.randomUUID();
  await q(`insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, is_sso_user, is_anonymous) values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2, crypt($3, gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}','','','','','','', false, false)`, [id, email, pw]);
  await q(`insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at) values ($1::text,$1::uuid, jsonb_build_object('sub',$1::text,'email',$2::text), 'email', now(), now(), now())`, [id, email]);
  return id;
}
async function family({ email, name, zip, about, needs, bMin, bMax, photo, ages, sched, open, traits, kids, coHire }) {
  const id = await mkUser(email);
  await q("update profiles set role='parent', preferred_name=$2, zip_code=$3, registered_at=now(), onboarding_completed_at=now() where id=$1", [id, name, zip]);
  await q("insert into parent_profiles (user_id) values ($1) on conflict do nothing", [id]);
  for (let i = 0; i < kids; i++) await q("insert into children (parent_user_id, pet_name, birth_month, birth_year, position) values ($1,$2,$3,$4,$5)", [id, `Kid${i + 1}`, 1 + i * 3, 2021 - i, i]);
  await q("insert into family_listings (user_id, household_name, about, care_needs, location_label, budget_min, budget_max, care_type, cover_photo_url, co_hire_interested, is_published) values ($1,$2,$3,$4,$5,$6,$7,'home_family',$8,$9,true) on conflict (user_id) do update set is_published=true, household_name=excluded.household_name", [id, name, about, needs, zip, bMin, bMax, photo, coHire]);
  for (const a of ages) await q("insert into family_listing_age_groups (user_id, age) values ($1,$2) on conflict do nothing", [id, a]);
  for (const s of sched) await q("insert into family_listing_schedule (user_id, slot) values ($1,$2) on conflict do nothing", [id, s]);
  for (const o of open) await q("insert into family_listing_open_to (user_id, kind) values ($1,$2) on conflict do nothing", [id, o]);
  for (const t of traits) await q("insert into family_listing_traits (user_id, trait_id) values ($1,$2) on conflict do nothing", [id, t]);
  console.log("  family:", name);
}
await family({ email: "mkt-fam-alvarez@raisingclub-test.dev", name: "The Alvarez", zip: "Brooklyn, NY", about: "Easy-going parents in Park Slope looking to share a caregiver with another nearby family.", needs: "Nanny share three mornings a week, focus on outdoor play and Spanish exposure.", bMin: 18, bMax: 26, photo: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=600", ages: ["toddler", "preschool"], sched: ["weekdays", "mornings"], open: ["nanny_share", "playdates"], traits: ["outdoor_activities", "bilingual_home", "pet_friendly"], kids: 2, coHire: true });
await family({ email: "mkt-fam-chen@raisingclub-test.dev", name: "The Chen-P", zip: "San Francisco, CA", about: "First-time parents seeking another infant family for a gentle, calm shared-care setup.", needs: "Looking to co-hire an experienced caregiver four full days per week.", bMin: 28, bMax: 38, photo: "https://images.unsplash.com/photo-1543342384-1f1350e27861?w=600", ages: ["infant"], sched: ["weekdays", "evenings"], open: ["co_hire", "meet_families"], traits: ["montessori_minded", "screen_free", "bilingual_home"], kids: 1, coHire: true });
await family({ email: "mkt-fam-okafor@raisingclub-test.dev", name: "The Okafor F", zip: "Brooklyn, NY", about: "Lively household of three kids — we love being outdoors and meeting neighborhood families.", needs: "After-school pickup and homework help, plus weekend playdates with similar families.", bMin: 18, bMax: 26, photo: "https://images.unsplash.com/photo-1609220136736-443140cffec6?w=600", ages: ["school_age", "older_child"], sched: ["afternoons", "weekends"], open: ["playdates", "meet_families"], traits: ["outdoor_activities", "active_sporty", "music_arts"], kids: 3, coHire: false });
console.log("Demo families ready (published).");
await c.end();
