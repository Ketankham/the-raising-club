import pg from "pg";
const c = new pg.Client({host:"db.xocomzqhlciukgodjptr.supabase.co",port:5432,user:"postgres",password:process.env.SUPABASE_DB_PASSWORD,database:"postgres",ssl:{rejectUnauthorized:false}});
await c.connect();
const tables = ['family_listings','family_listing_age_groups','family_listing_schedule','family_listing_open_to','family_listing_traits','family_traits','job_skills','job_invitations','marketplace_saves','conversations','conversation_participants','messages'];
const r = await c.query(`select tablename, rowsecurity from pg_tables where schemaname='public' and tablename = any($1)`,[tables]);
console.log("Tables + RLS:");
for(const t of tables){const f=r.rows.find(x=>x.tablename===t);console.log(`  ${f?'✓':'✗'} ${t}${f?` (rls=${f.rowsecurity})`:' MISSING'}`);}
const seed = await c.query("select count(*) from family_traits");
console.log("family_traits seeded:", seed.rows[0].count);
const cols = await c.query(`select column_name from information_schema.columns where table_name='job_posts' and column_name = any($1)`,[['owner_user_id','care_type','pay_min','schedule','is_co_hire','proposed_rate']]);
console.log("job_posts new cols:", cols.rows.map(x=>x.column_name).join(', '));
const orgnull = await c.query(`select is_nullable from information_schema.columns where table_name='job_posts' and column_name='org_id'`);
console.log("job_posts.org_id nullable:", orgnull.rows[0].is_nullable);
const fns = await c.query(`select proname from pg_proc where proname = any($1)`,[['job_can_manage','is_conversation_participant','get_or_create_direct_conversation']]);
console.log("functions:", fns.rows.map(x=>x.proname).join(', '));
const enums = await c.query(`select t.typname from pg_type t where t.typname = any($1)`,[['schedule_window','family_open_to','marketplace_target','conversation_kind']]);
console.log("new enums:", enums.rows.map(x=>x.typname).join(', '));
await c.end();
