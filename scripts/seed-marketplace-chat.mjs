// Seed a demo conversation so /chat isn't empty (between demo parent + Maya).
//   node --env-file=.env.local scripts/seed-marketplace-chat.mjs
import pg from "pg";
const c = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await c.connect();
const q = (t, p) => c.query(t, p);
const one = async (t, p) => (await q(t, p)).rows[0];
const parent = (await one("select id from profiles where preferred_name='Pat' and role='parent' order by created_at desc limit 1"));
const maya = (await one("select p.id from profiles p where p.preferred_name='Maya' and p.role='caregiver' order by created_at desc limit 1"));
if (!parent || !maya) { console.log("demo users missing — run seed-marketplace-demo first"); process.exit(0); }
// reuse existing thread if any
let cid = (await one("select c.id from conversations c join conversation_participants a on a.conversation_id=c.id and a.user_id=$1 join conversation_participants b on b.conversation_id=c.id and b.user_id=$2 where c.kind='direct' limit 1", [parent.id, maya.id]))?.id;
if (!cid) {
  cid = (await one("insert into conversations (kind, context_type, created_by) values ('direct','caregiver',$1) returning id", [parent.id])).id;
  await q("insert into conversation_participants (conversation_id, user_id) values ($1,$2),($1,$3)", [cid, parent.id, maya.id]);
}
await q("delete from messages where conversation_id=$1", [cid]);
await q("insert into messages (conversation_id, sender_user_id, body, created_at) values ($1,$2,'Hi Maya! We loved your profile and would love to chat about after-school care.', now() - interval '2 hours')", [cid, parent.id]);
await q("insert into messages (conversation_id, sender_user_id, body, created_at) values ($1,$2,'Thank you so much! I''d be happy to. Mon–Thu works great for me.', now() - interval '1 hour')", [cid, maya.id]);
console.log("Seeded demo conversation:", cid);
await c.end();
