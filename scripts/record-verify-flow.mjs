/**
 * Records the end-to-end Authenticate verification flow for a demo caregiver.
 *
 * Steps recorded:
 *   1. Profile page — "Not started" state (banner + status card)
 *   2. Click "Start Verification" → Medallion redirect (live Authenticate API)
 *   3. Navigate back — show "pending/not started" return state
 *   4. Simulate webhook by inserting verification rows directly into DB
 *   5. Refresh profile — both badges appear (Identity ✓ + Background Checked ✓)
 *   6. Marketplace grid — badges on caregiver card
 *   7. Admin panel — /admin/verifications row with approve/depublish actions
 *
 * Run from web/:
 *   $env:BASE="https://the-raising-club-staging.vercel.app"
 *   $env:QA_PASSWORD="RaisingQA!2026"
 *   node --env-file=.env.local scripts/record-verify-flow.mjs
 *
 * Omit BASE to run against http://localhost:3000 (requires npm run dev).
 */
import { chromium } from "playwright";
import pg from "pg";
import path from "node:path";
import fs from "node:fs";

const BASE = (process.env.BASE || "http://localhost:3000").replace(/\/$/, "");
const QA_PASSWORD = process.env.QA_PASSWORD || "RaisingQA!2026";
const QA_CAREGIVER = "qa-caregiver@raisingclub-test.dev";
const QA_ADMIN = "qa-admin@raisingclub-test.dev";
const DBPW = process.env.SUPABASE_DB_PASSWORD;

if (!DBPW) { console.error("❌ Set SUPABASE_DB_PASSWORD in .env.local"); process.exit(1); }

const OUT = path.resolve(process.cwd(), "..", "_recordings");
fs.mkdirSync(OUT, { recursive: true });
const ts = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DWELL = 2800;

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------
const db = new pg.Client({
  host: "db.xocomzqhlciukgodjptr.supabase.co",
  port: 5432, user: "postgres", password: DBPW,
  database: "postgres", ssl: { rejectUnauthorized: false },
});
await db.connect();
const q = (sql, params) => db.query(sql, params);
const one = async (sql, params) => (await q(sql, params)).rows[0];

// ---------------------------------------------------------------------------
// Step helper
// ---------------------------------------------------------------------------
let stepN = 0;
async function step(label, fn, dwell = DWELL) {
  stepN++;
  console.log(`\n[${stepN}] ${label}`);
  await fn();
  await sleep(dwell);
}

// ---------------------------------------------------------------------------
// DB setup — reset QA caregiver to a clean "pre-verification" state
// ---------------------------------------------------------------------------
console.log("⚙  Resetting QA caregiver to pre-verification state …");
const cg = await one(
  "select p.id from profiles p where p.email = $1",
  [QA_CAREGIVER],
);
if (!cg) { console.error("❌ QA caregiver not found — run create-qa-users.mjs first"); process.exit(1); }
const cgId = cg.id;

// Ensure onboarding is complete and caregiver_profiles row exists
await q(
  `update profiles set onboarding_completed_at = coalesce(onboarding_completed_at, now()) where id = $1`,
  [cgId],
);
await q(
  `insert into caregiver_profiles
     (user_id, headline, about, experience_level, rate_amount, rate_unit,
      looking_for_paid_work, intents, is_published, authenticate_user_code)
   values
     ($1, 'Experienced childcare specialist', 'Passionate about early childhood development with 5+ years experience.',
      '5_10_years', 25, 'hour', true, '{paid_work}', true, null)
   on conflict (user_id) do update
     set is_published = true,
         authenticate_user_code = null,
         headline = excluded.headline`,
  [cgId],
);

// Clear any existing verifications so we start fresh
await q("delete from verifications where user_id = $1", [cgId]);
console.log("✓  DB state reset (no verifications, is_published=true)");

// ---------------------------------------------------------------------------
// Browser setup
// ---------------------------------------------------------------------------
const browser = await chromium.launch({ headless: true, slowMo: 180 });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
page.on("console", (m) => m.type() === "error" && console.log("  [console error]", m.text()));

let ok = true;

try {
  // ── 1. Sign in as QA caregiver ──────────────────────────────────────────
  await step("Sign in as QA caregiver", async () => {
    await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(QA_CAREGIVER);
    await page.locator('input[type="password"]').fill(QA_PASSWORD);
    await sleep(600);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/(dashboard|profile)/, { timeout: 40000 });
    await sleep(1500);
  });

  // ── 2. Profile — "Not Started" state ────────────────────────────────────
  await step("Profile page — verification not yet started", async () => {
    await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
    await sleep(2000);
    // Scroll down to verification card
    const verCard = page.getByText(/start verification|get verified/i).first();
    await verCard.waitFor({ timeout: 15000 }).catch(() => {});
    await verCard.scrollIntoViewIfNeeded().catch(() => {});
    await sleep(2000);
    // Screenshot the "not started" state
    await page.screenshot({ path: path.join(OUT, `verify-1-not-started-${ts}.png`), fullPage: false });
    console.log("  📸  Screenshot: not-started state");
  }, 3500);

  // ── 3. Click Start Verification → Medallion redirect ────────────────────
  let medallionLanded = false;
  await step("Click Start Verification (live Authenticate API)", async () => {
    const btn = page.getByRole("button", { name: /start verification/i }).first();
    const visible = await btn.isVisible().catch(() => false);
    if (!visible) {
      console.log("  ⚠  Start Verification button not visible — API key may be missing on this env");
      return;
    }
    await btn.click();
    // Wait for either a redirect to authenticate.com OR an error toast
    try {
      await page.waitForURL(/authenticating\.com|authenticate\.com/, { timeout: 20000 });
      medallionLanded = true;
      console.log("  ✓  Redirected to Medallion:", page.url().slice(0, 80) + "…");
      await sleep(3000);
      await page.screenshot({ path: path.join(OUT, `verify-2-medallion-${ts}.png`), fullPage: false });
      console.log("  📸  Screenshot: Medallion page");
    } catch {
      console.log("  ⚠  No Medallion redirect (env missing or timeout) — continuing demo");
      await page.screenshot({ path: path.join(OUT, `verify-2-redirect-failed-${ts}.png`), fullPage: false });
    }
  }, 3000);

  // ── 4. Navigate back to profile ──────────────────────────────────────────
  await step("Navigate back to profile (pending state)", async () => {
    await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
    await sleep(2000);
    // Check what authenticate_user_code was saved (if API call worked)
    const updated = await one(
      "select authenticate_user_code from caregiver_profiles where user_id = $1",
      [cgId],
    );
    if (updated?.authenticate_user_code) {
      console.log("  ✓  authenticate_user_code saved:", updated.authenticate_user_code.slice(0, 20) + "…");
    } else {
      console.log("  ℹ  No authenticate_user_code yet (API not called)");
    }
    await page.screenshot({ path: path.join(OUT, `verify-3-back-from-medallion-${ts}.png`), fullPage: false });
    console.log("  📸  Screenshot: back on profile after Medallion");
  }, 2500);

  // ── 5. Simulate webhook — insert identity verified ───────────────────────
  console.log("\n⚙  Simulating webhook: identity verified …");
  await q(
    `insert into verifications (user_id, type, status, provider, reference, metadata)
     values ($1, 'identity', 'verified', 'authenticate', 'sim-identity-${ts}',
             '{"rawStatus":"verified","simulatedForDemo":true}'::jsonb)
     on conflict (user_id, type) do update
       set status = 'verified', updated_at = now()`,
    [cgId],
  );
  console.log("  ✓  Identity verification row inserted");

  // ── 6. Profile — Identity badge appears ─────────────────────────────────
  await step("Refresh profile — identity verified badge", async () => {
    await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
    await sleep(2000);
    await page.mouse.wheel(0, -800);
    await sleep(1000);
    await page.screenshot({ path: path.join(OUT, `verify-4-identity-badge-${ts}.png`), fullPage: false });
    console.log("  📸  Screenshot: identity badge visible");
  }, 3000);

  // ── 7. Simulate webhook — background check complete ──────────────────────
  console.log("\n⚙  Simulating webhook: background check complete …");
  await q(
    `insert into verifications (user_id, type, status, provider, reference, metadata,
       admin_review_required)
     values ($1, 'background_check', 'verified', 'authenticate', 'sim-bgcheck-${ts}',
             '{"rawStatus":"complete","criminalRecordsFound":false,"simulatedForDemo":true}'::jsonb,
             false)
     on conflict (user_id, type) do update
       set status = 'verified', admin_review_required = false, updated_at = now()`,
    [cgId],
  );
  console.log("  ✓  Background check verification row inserted");

  // ── 8. Profile — both badges ─────────────────────────────────────────────
  await step("Refresh profile — both badges (Verified + Background Checked)", async () => {
    await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
    await sleep(2500);
    await page.mouse.wheel(0, -800);
    await sleep(1000);
    await page.screenshot({ path: path.join(OUT, `verify-5-both-badges-${ts}.png`), fullPage: false });
    console.log("  📸  Screenshot: both badges");
  }, 3500);

  // ── 9. Marketplace grid — badges on card ─────────────────────────────────
  await step("Marketplace grid — badges on caregiver card", async () => {
    await page.goto(`${BASE}/connect`, { waitUntil: "domcontentloaded" });
    await sleep(3000);
    // Look for a card with the QA caregiver's badge
    await page.screenshot({ path: path.join(OUT, `verify-6-marketplace-badge-${ts}.png`), fullPage: false });
    console.log("  📸  Screenshot: marketplace with badges");
  }, 3000);

  // ── 10. Sign out and sign in as admin ─────────────────────────────────────
  await step("Sign in as admin → verifications panel", async () => {
    await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
    await sleep(800);
    await page.locator('input[type="email"]').fill(QA_ADMIN);
    await page.locator('input[type="password"]').fill(QA_PASSWORD);
    await sleep(500);
    await page.getByRole("button", { name: /sign in/i }).click();
    await page.waitForURL(/\/admin/, { timeout: 40000 });
    await sleep(1500);
  });

  // ── 11. Admin verifications page ─────────────────────────────────────────
  await step("Admin verifications page", async () => {
    await page.goto(`${BASE}/admin/verifications`, { waitUntil: "domcontentloaded" });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUT, `verify-7-admin-panel-${ts}.png`), fullPage: false });
    console.log("  📸  Screenshot: admin verifications panel");
  }, 3500);

  // ── 12. Simulate red flag for demo ────────────────────────────────────────
  console.log("\n⚙  Simulating red flag: sex offender match …");
  // Create a temporary caregiver to show the red flag state
  const stamp = Date.now();
  const rfEmail = `rf-demo-${stamp}@raisingclub-test.dev`;

  // We'll just update the QA caregiver's background_check row to show a red flag state
  await q(
    `update verifications set
       status = 'failed',
       metadata = '{"redFlag":true,"redFlagType":"sex_offender","simulatedForDemo":true}'::jsonb,
       admin_review_required = true
     where user_id = $1 and type = 'background_check'`,
    [cgId],
  );
  await q("update caregiver_profiles set is_published = false where user_id = $1", [cgId]);
  console.log("  ✓  Red flag state set");

  await step("Admin verifications — red flag alert", async () => {
    await page.reload({ waitUntil: "domcontentloaded" });
    await sleep(2500);
    await page.screenshot({ path: path.join(OUT, `verify-8-admin-red-flag-${ts}.png`), fullPage: false });
    console.log("  📸  Screenshot: admin red flag state");
  }, 3500);

  console.log("\n✅ Verification flow demo complete!");

} catch (e) {
  console.error("\n❌ Recording failed:", e.message);
  await page.screenshot({ path: path.join(OUT, `verify-FAILURE-${ts}.png`), fullPage: true }).catch(() => {});
  ok = false;
} finally {
  // Clean up — restore QA caregiver to a clean state
  await q("delete from verifications where user_id = $1", [cgId]).catch(() => {});
  await q(
    "update caregiver_profiles set is_published = true, authenticate_user_code = null where user_id = $1",
    [cgId],
  ).catch(() => {});
  console.log("⚙  DB cleaned up");

  const video = page.video();
  await context.close();
  await browser.close();
  await db.end();

  if (video) {
    try {
      const src = await video.path();
      const dest = path.join(OUT, `verify-flow-demo-${ts}.webm`);
      fs.renameSync(src, dest);
      console.log("🎬 Video saved:", dest);
    } catch (e) {
      console.log("🎬 Video (raw):", e.message);
    }
  }

  if (!ok) process.exitCode = 1;
}
