// Seed a few published, public test events (with a session + location each) so
// the /events UI has data. Idempotent on slug. Run:
//   node --env-file=.env.local scripts/seed-test-events.mjs
import pg from "pg";
const password = process.env.SUPABASE_DB_PASSWORD;
if (!password) { console.error("Set SUPABASE_DB_PASSWORD"); process.exit(1); }
const client = new pg.Client({
  host: "db.xocomzqhlciukgodjptr.supabase.co",
  port: 5432, user: "postgres", password, database: "postgres",
  ssl: { rejectUnauthorized: false },
});
await client.connect();

const events = [
  {
    slug: "montessori-club-babies-toddlers",
    title: "The Montessori Club for Babies and Toddlers",
    summary: "Parent-and-child sessions guided by Montessori-trained educators — a space where your child builds confidence, concentration, and independence.",
    what_to_expect: "Three parent-led play sessions guided by Montessori-trained educators, a space where your child builds confidence, concentration, and independence. Our carefully prepared environment encourages exploration and discovery.",
    join_mode: "in_person", style: "ongoing_series", participation_type: "children_with_adult",
    age_min: 6, age_max: 36, price_model: "paid", price_cents: 4500, child_capacity: 15,
    is_featured: true,
    session: ["2026-02-21T09:00:00-05:00", "2026-02-21T10:30:00-05:00"],
    loc: { kind: "physical", neighborhood: "Brooklyn", address: "123 Main Street, Suite 100, Brooklyn, NY" },
    hero: "https://images.unsplash.com/photo-1503454537195-1dcabb73ffb9?w=800&q=80",
  },
  {
    slug: "toddler-open-play-morning",
    title: "Toddler Open Play Morning",
    summary: "Drop in for free play in a warm, safe space. Caregivers welcome — coffee on us.",
    what_to_expect: "Open-ended play with soft blocks, sensory bins, and music. A relaxed neighborhood meet-up for little ones and the grown-ups who love them.",
    join_mode: "in_person", style: "open_play", participation_type: "children_with_adult",
    age_min: 12, age_max: 48, price_model: "included", price_cents: 0, child_capacity: 20,
    is_featured: false,
    session: ["2026-03-07T10:00:00-05:00", "2026-03-07T11:30:00-05:00"],
    loc: { kind: "physical", neighborhood: "Upper West Side", address: "200 Columbus Ave, New York, NY" },
    hero: "https://images.unsplash.com/photo-1607453998774-d533f65dac99?w=800&q=80",
  },
  {
    slug: "newborn-sleep-workshop-online",
    title: "Newborn Sleep & Soothing Workshop",
    summary: "A live online workshop for expectant and new parents on gentle sleep foundations.",
    what_to_expect: "A 90-minute live session covering newborn sleep cycles, soothing techniques, and setting up a calm sleep environment. Q&A with a pediatric sleep educator.",
    join_mode: "online", style: "workshop", participation_type: "adults_only",
    age_min: 0, age_max: 3, price_model: "paid", price_cents: 2500, child_capacity: null,
    is_featured: false,
    session: ["2026-03-12T19:00:00-05:00", "2026-03-12T20:30:00-05:00"],
    loc: { kind: "digital", neighborhood: null, address: null },
    hero: "https://images.unsplash.com/photo-1555252333-9f8e92e65df9?w=800&q=80",
  },
];

for (const e of events) {
  const ev = await client.query(
    `insert into events
       (slug, title, summary, what_to_expect, hero_image_url, join_mode, style,
        participation_type, expectant_parents_allowed, age_min_months, age_max_months,
        visibility, status, price_model, price_cents, child_capacity, is_featured,
        host_type, timezone, published_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,'public','published',$12,$13,$14,$15,'trc','America/New_York',now())
     on conflict (slug) do update set
        title=excluded.title, summary=excluded.summary, what_to_expect=excluded.what_to_expect,
        hero_image_url=excluded.hero_image_url, is_featured=excluded.is_featured,
        price_model=excluded.price_model, price_cents=excluded.price_cents
     returning id`,
    [e.slug, e.title, e.summary, e.what_to_expect, e.hero, e.join_mode, e.style,
     e.participation_type, false, e.age_min, e.age_max, e.price_model, e.price_cents,
     e.child_capacity, e.is_featured],
  );
  const id = ev.rows[0].id;
  // reset child rows so re-runs stay clean
  await client.query("delete from event_sessions where event_id=$1", [id]);
  await client.query("delete from event_locations where event_id=$1", [id]);
  await client.query(
    "insert into event_sessions (event_id, starts_at, ends_at) values ($1,$2,$3)",
    [id, e.session[0], e.session[1]],
  );
  await client.query(
    `insert into event_locations (event_id, kind, neighborhood, address, platform, join_url)
     values ($1,$2,$3,$4,$5,$6)`,
    [id, e.loc.kind, e.loc.neighborhood, e.loc.address,
     e.loc.kind === "digital" ? "zoom" : null,
     e.loc.kind === "digital" ? "https://zoom.us/j/example" : null],
  );
  console.log(`seeded: ${e.slug}`);
}

await client.end();
console.log("\n✓ Test events seeded.");
