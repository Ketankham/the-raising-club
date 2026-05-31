// Connect Families flow under REAL RLS: a parent fills + publishes a family
// listing (+ child sets), another user browses it via marketplace_family_cards,
// then unpublish hides it. Self-cleans.  node --env-file=.env.local scripts/smoke-family.mjs
import pg from "pg";
import crypto from "node:crypto";
const c = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await c.connect();
const q = (t, p) => c.query(t, p);
const one = async (t, p) => (await q(t, p)).rows[0];
let ok = true;
const assert = (cond, label) => { console.log(`${cond ? "✓" : "✗"} ${label}`); if (!cond) ok = false; };
async function mkUser(email) {
  const id = crypto.randomUUID();
  await q(`insert into auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, created_at, updated_at, raw_app_meta_data, raw_user_meta_data, confirmation_token, recovery_token, email_change_token_new, email_change, email_change_token_current, reauthentication_token, is_sso_user, is_anonymous) values ($1,'00000000-0000-0000-0000-000000000000','authenticated','authenticated',$2, crypt('Smoke#2026', gen_salt('bf')), now(), now(), now(), '{"provider":"email","providers":["email"]}','{}','','','','','','', false, false)`, [id, email]);
  return id;
}
const asUser = (id) => q("select set_config('request.jwt.claims', json_build_object('sub',$1::text,'role','authenticated')::text, true)", [id]);
const s = Date.now();
let parentId, viewerId;
try {
  parentId = await mkUser(`fam.parent.${s}@raisingclub-test.dev`);
  viewerId = await mkUser(`fam.viewer.${s}@raisingclub-test.dev`);
  await q("update profiles set role='parent', first_name='Sam', last_name='Okafor', preferred_name='Sam', zip_code='Brooklyn, NY', registered_at=now(), onboarding_completed_at=now() where id=$1", [parentId]);
  await q("update profiles set role='caregiver', preferred_name='Viewer', registered_at=now(), onboarding_completed_at=now() where id=$1", [viewerId]);
  await q("insert into children (parent_user_id, pet_name, birth_month, birth_year, position) values ($1,'Bean',4,2022,0),($1,'Sprout',7,2020,1)", [parentId]);
  const trait = (await one("select id from family_traits limit 1")).id;

  // ---- PARENT publishes a family listing (RLS) ----------------------------
  await q("begin"); await q("set local role authenticated"); await asUser(parentId);
  await q("insert into family_listings (user_id, household_name, about, care_needs, location_label, budget_min, budget_max, care_type, co_hire_interested, is_published) values ($1,'The Okafor F','Easy-going parents in Park Slope.','Nanny share three mornings a week.','Brooklyn, NY',18,26,'home_family',true,true)", [parentId]);
  await q("insert into family_listing_age_groups (user_id, age) values ($1,'toddler'),($1,'preschool')", [parentId]);
  await q("insert into family_listing_schedule (user_id, slot) values ($1,'weekdays'),($1,'mornings')", [parentId]);
  await q("insert into family_listing_open_to (user_id, kind) values ($1,'nanny_share'),($1,'playdates')", [parentId]);
  await q("insert into family_listing_traits (user_id, trait_id) values ($1,$2)", [parentId, trait]);
  const own = await one("select household_name, is_published from family_listings where user_id=$1", [parentId]);
  assert(own && own.is_published, "parent: can save + read own published listing");
  await q("commit");

  // ---- VIEWER browses (RLS via RPC) ---------------------------------------
  await q("begin"); await q("set local role authenticated"); await asUser(viewerId);
  const cards = (await q("select marketplace_family_cards() as j")).rows.map((r) => r.j);
  const mine = cards.find((x) => x.userId === parentId);
  assert(!!mine, "viewer: family appears in Connect Families (RPC)");
  assert(mine && mine.householdName === "The Okafor F" && Number(mine.childrenCount) === 2, "viewer: household name + children count (2)");
  assert(mine && (mine.ageGroups?.length ?? 0) === 2 && (mine.traits?.length ?? 0) === 1, "viewer: ages + traits surface");
  assert(mine && Number(mine.budgetMin) === 18 && Number(mine.budgetMax) === 26, "viewer: budget range surfaces");
  // cannot read the raw children rows (owner-only)
  const rawKids = (await q("select id from children where parent_user_id=$1", [parentId])).rows.length;
  assert(rawKids === 0, "viewer: cannot read raw children rows (only the count via RPC)");
  await q("commit");

  // ---- PARENT unpublishes -> hidden ---------------------------------------
  await q("begin"); await q("set local role authenticated"); await asUser(parentId);
  await q("update family_listings set is_published=false where user_id=$1", [parentId]);
  await q("commit");
  await q("begin"); await q("set local role authenticated"); await asUser(viewerId);
  const after = (await q("select marketplace_family_cards() as j")).rows.map((r) => r.j).find((x) => x.userId === parentId);
  assert(!after, "viewer: unpublished family no longer listed");
  await q("commit");
} catch (e) {
  console.error("ERROR:", e.message); ok = false; try { await q("rollback"); } catch {}
} finally {
  for (const id of [parentId, viewerId]) if (id) await q("delete from auth.users where id=$1", [id]);
  await c.end();
  console.log(ok ? "\n✓ connect families flow PASSED" : "\n✗ FAILURES above");
  process.exit(ok ? 0 : 1);
}
