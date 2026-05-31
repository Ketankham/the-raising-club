// Full Chat flow under REAL RLS: start (dedup) a 1:1 thread, two-way messaging,
// inbox unread counts, peer identity, mark-read, stranger isolation. Self-cleans.
//   node --env-file=.env.local scripts/smoke-chat.mjs
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
const begin = async (id) => { await q("begin"); await q("set local role authenticated"); await q("select set_config('request.jwt.claims', json_build_object('sub',$1::text,'role','authenticated')::text, true)", [id]); };
const s = Date.now();
let A, B, C;
try {
  A = await mkUser(`chat.a.${s}@raisingclub-test.dev`);
  B = await mkUser(`chat.b.${s}@raisingclub-test.dev`);
  C = await mkUser(`chat.c.${s}@raisingclub-test.dev`);
  await q("update profiles set role='parent', first_name='Ana', last_name='Reyes', preferred_name='Ana', registered_at=now(), onboarding_completed_at=now() where id=$1", [A]);
  await q("update profiles set role='caregiver', first_name='Ben', last_name='Cole', preferred_name='Ben', registered_at=now(), onboarding_completed_at=now() where id=$1", [B]);
  await q("update profiles set role='caregiver', preferred_name='Cy', registered_at=now(), onboarding_completed_at=now() where id=$1", [C]);

  // A starts a thread with B (dedup)
  await begin(A);
  const cid = (await one("select get_or_create_direct_conversation($1,null,null) id", [B])).id;
  const cid2 = (await one("select get_or_create_direct_conversation($1,null,null) id", [B])).id;
  assert(!!cid && cid === cid2, "A: get_or_create dedupes the 1:1 thread");
  await q("insert into messages (conversation_id, sender_user_id, body) values ($1,$2,'Hi Ben!')", [cid, A]);
  await q("commit");

  // B sees it in the inbox with unread + peer = Ana
  await begin(B);
  const inbox = (await q("select marketplace_conversations() j")).rows.map((r) => r.j);
  const row = inbox.find((x) => x.conversationId === cid);
  assert(!!row, "B: conversation appears in inbox");
  assert(row && Number(row.unreadCount) === 1 && row.lastMessage === "Hi Ben!", "B: unread=1 + last message preview");
  assert(row && row.peers?.[0]?.name === "Ana R.", "B: peer identity (Ana R.) via definer");
  const peers = (await one("select conversation_peers($1) j", [cid])).j;
  assert(peers && peers[0]?.userId === A, "B: conversation_peers returns A");
  await q("insert into messages (conversation_id, sender_user_id, body) values ($1,$2,'Hi Ana!')", [cid, B]);
  // B marks read
  await q("update conversation_participants set last_read_at=now() where conversation_id=$1 and user_id=$2", [cid, B]);
  await q("commit");

  // A now has 1 unread (Ben's reply)
  await begin(A);
  const inboxA = (await q("select marketplace_conversations() j")).rows.map((r) => r.j).find((x) => x.conversationId === cid);
  assert(inboxA && Number(inboxA.unreadCount) === 1 && inboxA.lastMessage === "Hi Ana!", "A: sees Ben's reply unread");
  const msgs = (await q("select body from messages where conversation_id=$1 order by created_at", [cid])).rows;
  assert(msgs.length === 2, "A: thread has both messages (RLS read)");
  await q("commit");

  // stranger C is blocked
  await begin(C);
  const cPeers = (await one("select conversation_peers($1) j", [cid])).j;
  assert(cPeers === null, "C (stranger): conversation_peers returns null");
  const cMsgs = (await q("select id from messages where conversation_id=$1", [cid])).rows.length;
  assert(cMsgs === 0, "C (stranger): cannot read messages");
  const cInbox = (await q("select marketplace_conversations() j")).rows.length;
  assert(cInbox === 0, "C (stranger): empty inbox");
  // and cannot inject a message
  let blocked = false;
  try { await q("insert into messages (conversation_id, sender_user_id, body) values ($1,$2,'sneaky')", [cid, C]); }
  catch { blocked = true; }
  assert(blocked, "C (stranger): cannot post into the thread (RLS insert blocked)");
  await q("rollback");
} catch (e) {
  console.error("ERROR:", e.message); ok = false; try { await q("rollback"); } catch {}
} finally {
  for (const id of [A, B, C]) if (id) await q("delete from auth.users where id=$1", [id]);
  await c.end();
  console.log(ok ? "\n✓ chat flow PASSED" : "\n✗ FAILURES above");
  process.exit(ok ? 0 : 1);
}
