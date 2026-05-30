// Seed v1 of the two event waivers (from the master doc) and attach them to all
// published events. Idempotent. Run:
//   node --env-file=.env.local scripts/seed-waivers.mjs
import pg from "pg";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) { console.error("Set SUPABASE_DB_PASSWORD"); process.exit(1); }
const client = new pg.Client({
  host: "db.xocomzqhlciukgodjptr.supabase.co",
  port: 5432, user: "postgres", password, database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const PARTICIPATION = `Event Participation, Assumption of Risk & Liability Acknowledgment

During events listed, hosted, or facilitated through The Raising Club ("TRC"), children and caregivers participate in group-based, developmentally appropriate activities. Events may be hosted or co-hosted by TRC and/or independent third parties ("Event Hosts").

Assumption of Ordinary Risk — I understand participation includes normal, everyday risks (minor falls, bumps, emotional dysregulation) and I voluntarily assume responsibility for these ordinary, inherent risks.

Supervision & Scope of Care — Children remain under the supervision of the attending adult unless otherwise stated. Events are group settings and do not include one-on-one childcare unless specified. TRC and Event Hosts are not medical providers.

Health Information & Emergency Authorization — I agree to inform TRC and/or the Host of relevant medical conditions, allergies, or special needs. In a medical emergency, if I cannot be reached, I authorize TRC and/or the Host to seek emergency medical treatment; I am responsible for resulting expenses.

Limited Release of Liability — To the fullest extent permitted by law, I release and hold harmless TRC, its operators, Event Hosts, and their staff from claims arising from ordinary, inherent risks, except those caused by gross negligence or willful misconduct. Nothing here limits rights that cannot be waived under applicable law.`;

const MEDIA = `Photo, Video & Media Release and Consent

During events hosted or facilitated through The Raising Club ("TRC"), photos, videos, and/or audio recordings may be captured for documentation, educational, and training purposes.

Internal Use (Required) — I agree TRC and/or Hosts may capture and use photos, videos, or recordings of me and/or the child under my care for internal documentation, staff training, and program development, in any format now known or later developed.

Optional Promotional & Marketing Use — Please choose Yes or No below. If YES, I authorize TRC and/or Hosts to use, reproduce, publish, and distribute such media for promotional and marketing purposes (websites, social media, print, presentations, digital communications); I will not receive compensation and waive any right to inspect or approve finished materials. If NO, TRC and Hosts will take reasonable steps to avoid including me or the child in publicly distributed content (internal use may still occur).`;

async function upsertWaiver(kind, title, body) {
  const r = await client.query(
    `insert into waivers (kind, version, title, body, is_active)
     values ($1, 1, $2, $3, true)
     on conflict (kind, version) do update set title=excluded.title, body=excluded.body, is_active=true
     returning id`,
    [kind, title, body],
  );
  return r.rows[0].id;
}

const participationId = await upsertWaiver(
  "participation",
  "Event Participation & Accident Waiver",
  PARTICIPATION,
);
const mediaId = await upsertWaiver("media_release", "Photo, Video & Media Release", MEDIA);

const { rows: events } = await client.query("select id from events");
for (const e of events) {
  await client.query(
    `insert into event_waivers (event_id, waiver_id) values ($1,$2), ($1,$3)
     on conflict do nothing`,
    [e.id, participationId, mediaId],
  );
}

await client.end();
console.log(`✓ Seeded 2 waivers, attached to ${events.length} events.`);
