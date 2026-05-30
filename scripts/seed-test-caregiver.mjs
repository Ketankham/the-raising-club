// Seeds one published test caregiver with rich data, prints the id to view at
// /profile/<id>. Cleanup: delete the printed user afterward.
import { createClient } from "@supabase/supabase-js";
import pg from "pg";

const URL = "https://xocomzqhlciukgodjptr.supabase.co";
const KEY = "sb_publishable_NGbgWS4e-PNaV0uhAtjFtQ_e8zZbeGg";
const sb = createClient(URL, KEY);
const { data } = await sb.auth.signInAnonymously();
const id = data.user.id;

const a = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await a.connect();
const q = (s, p) => a.query(s, p);

await q("update profiles set role='caregiver', first_name='Maya', last_name='Patel', preferred_name='Maya', zip_code='11201', phone='(555) 012-3456', email='maya.patel@example.com', registered_at=now() where id=$1", [id]);
await q("insert into caregiver_profiles (user_id, intents, headline, about, experience_level, is_published) values ($1, '{paid_work,connect}', 'Nanny & Early Childhood Educator', $2, '5_10_years', true) on conflict (user_id) do update set headline=excluded.headline, about=excluded.about, experience_level=excluded.experience_level, is_published=true", [id, "I'm a nurturing caregiver with over 6 years working with children from infancy through early school age. I believe in building trust, routines, and genuine connection with every child and family."]);
for (const age of ["infant", "toddler", "preschool", "school_age"]) await q("insert into caregiver_age_groups values ($1,$2) on conflict do nothing", [id, age]);
for (const s of ["one_child_family", "multi_children_family", "nanny_share", "tutoring_enrichment"]) await q("insert into caregiver_care_settings values ($1,$2) on conflict do nothing", [id, s]);
for (const e of ["own_family", "nannying", "daycare_preschool", "teaching_tutoring"]) await q("insert into caregiver_experience_types values ($1,$2) on conflict do nothing", [id, e]);
for (const [lang, primary] of [["English", true], ["Hindi", false], ["Gujarati", false]]) await q("insert into caregiver_languages values ($1,$2,$3) on conflict do nothing", [id, lang, primary]);
await q("insert into caregiver_availability (user_id, types, windows, openness) values ($1, '{full_time,part_time}', '{mornings,afternoons,weekends}', '{long_term}') on conflict (user_id) do nothing", [id]);
await q("insert into caregiver_education (user_id, level) values ($1, 'bachelor') on conflict (user_id) do nothing", [id]);
for (const c of ["CPR Certified", "First Aid", "Early Childhood Development (EDU 201)", "TRC Caregiver Workshop"]) await q("insert into caregiver_certifications (user_id, name) values ($1,$2)", [id, c]);
await q("insert into verifications (user_id, type, status) values ($1, 'identity', 'verified')", [id]);

console.log("SEEDED_CAREGIVER_ID=" + id);
await a.end();
