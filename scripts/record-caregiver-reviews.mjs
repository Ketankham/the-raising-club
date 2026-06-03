/**
 * Records the CAREGIVER REVIEW flow end-to-end, signed in as the QA caregiver
 * (see ../qa-creds.md):
 *   1. Caregiver opens /profile -> "Invite & manage reviews"
 *   2. Creates a review invite (copy-link; SMTP isn't configured)
 *   3. Opens the public review link and submits a star rating + written review
 *   4. Back as the caregiver, publishes the pending review to their profile
 *   5. Shows the published review on /profile
 *
 * The invite token is read back from the DB so the public review page can be
 * driven in the same recording.
 *
 * Run (from web/):
 *   $env:QA_PASSWORD="RaisingQA!2026"
 *   node --env-file=.env.local scripts/record-caregiver-reviews.mjs
 *
 * Video is written to the PROJECT ROOT (outside the public git repo).
 */
import { chromium } from "playwright";
import pg from "pg";
import path from "path";
import fs from "fs";

const BASE = process.env.BASE || "http://localhost:3000";
const EMAIL = process.env.QA_EMAIL || "qa-caregiver@raisingclub-test.dev";
const PASSWORD = process.env.QA_PASSWORD || "RaisingQA!2026";

const OUT = path.resolve(process.cwd(), ".."); // project root
const ts = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DWELL = 3000;
const TYPE = 40;

// Unique content so we can find & publish exactly this review.
const REVIEWER_NAME = `Jordan M. (${ts.toString().slice(-4)})`;
const REVIEW_BODY =
  "Warm, dependable, and wonderful with our toddler — calm routines and clear daily updates. We'd recommend them to any family.";

async function tokenForCaregiver() {
  const client = new pg.Client({
    host: "db.xocomzqhlciukgodjptr.supabase.co",
    port: 5432,
    user: "postgres",
    password: process.env.SUPABASE_DB_PASSWORD,
    database: "postgres",
    ssl: { rejectUnauthorized: false },
  });
  await client.connect();
  const r = await client.query(
    `select ri.token
       from review_invitations ri
       join auth.users u on u.id = ri.caregiver_user_id
      where u.email = $1
      order by ri.created_at desc
      limit 1`,
    [EMAIL],
  );
  await client.end();
  return r.rows[0]?.token ?? null;
}

const browser = await chromium.launch({ headless: true, slowMo: 220 });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
page.on("console", (m) => m.type() === "error" && console.log("  [console]", m.text()));

async function step(label, fn, dwell = DWELL) {
  console.log("▶", label);
  await fn();
  await sleep(dwell);
}

try {
  await step("Sign in as the caregiver", async () => {
    await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await sleep(600);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/dashboard", { timeout: 40000 });
    await sleep(1200);
  });

  await step("Skip the welcome tour if it appears", async () => {
    const skip = page.getByRole("button", { name: /Skip the tour/i });
    await skip.waitFor({ timeout: 5000 }).catch(() => {});
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await sleep(800);
    }
  });

  await step(
    "Open the profile and go to Reviews",
    async () => {
      await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "About me", exact: true }).waitFor({ timeout: 30000 });
      await sleep(1500);
      const reviewsLink = page.getByRole("link", { name: /Invite .* manage reviews/i });
      await reviewsLink.scrollIntoViewIfNeeded();
      await sleep(800);
      await reviewsLink.click();
      await page.waitForURL("**/profile/reviews", { timeout: 30000 });
      await page.getByRole("heading", { name: "Reviews", exact: true }).waitFor();
      await sleep(1500);
    },
    3500,
  );

  await step("Create a review invite", async () => {
    await page.getByPlaceholder("Their name").pressSequentially(REVIEWER_NAME, { delay: TYPE });
    await page.getByPlaceholder(/Relationship/).pressSequentially("Family", { delay: TYPE });
    await page.getByPlaceholder(/Email/).pressSequentially("family@example.com", { delay: 25 });
    await sleep(800);
    await page.getByRole("button", { name: /Create invite link/i }).click();
    await page.getByText(/Invite created/i).waitFor({ timeout: 15000 });
    await sleep(2500); // show the invite appear in the list + "link copied" toast
  });

  // Read the freshly-created invite token so we can drive the public page.
  const token = await tokenForCaregiver();
  if (!token) throw new Error("Could not read invite token from DB");

  await step(
    "Open the public review link (what the family sees)",
    async () => {
      await page.goto(`${BASE}/review/${token}`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: /Leave a review/i }).waitFor({ timeout: 20000 });
      await sleep(2000);
    },
    3500,
  );

  await step("Family fills in the review", async () => {
    await page.getByRole("button", { name: "5 stars" }).click();
    await sleep(800);
    // Name + relationship are prefilled from the invite; write the review body.
    const body = page.getByPlaceholder(/What was it like working with them/i);
    await body.click();
    await body.pressSequentially(REVIEW_BODY, { delay: 14 });
    await sleep(1200);
    await page.getByRole("button", { name: "Submit review" }).click();
    await page.getByRole("heading", { name: /Thank you/i }).waitFor({ timeout: 20000 });
    await sleep(2500);
  });

  await step(
    "Back as the caregiver: approve & publish the review",
    async () => {
      await page.goto(`${BASE}/profile/reviews`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: /Awaiting your approval/i }).waitFor({ timeout: 20000 });
      await sleep(1500);
      // Find the card holding our review body, then click its Publish button.
      const card = page.locator("div.rounded-xl").filter({ hasText: REVIEW_BODY.slice(0, 40) }).first();
      await card.scrollIntoViewIfNeeded();
      await sleep(800);
      await card.getByRole("button", { name: /Publish/i }).click();
      await page.getByText("Published — now on your profile").waitFor({ timeout: 15000 });
      await sleep(2500);
    },
    3500,
  );

  await step(
    "Show the published review on the profile",
    async () => {
      await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
      const highlights = page.getByRole("heading", { name: /Highlights from Families/i });
      await highlights.waitFor({ timeout: 20000 });
      await highlights.scrollIntoViewIfNeeded();
      await sleep(3000);
    },
    4000,
  );

  console.log("\n✅ Review flow complete: invite -> submit -> publish -> on profile.");
} catch (e) {
  console.error("\n❌ Recording failed:", e.message);
  await page.screenshot({ path: path.join(OUT, `caregiver-reviews-FAILURE-${ts}.png`), fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    try {
      const src = await video.path();
      const dest = path.join(OUT, `caregiver-reviews-demo-${ts}.webm`);
      fs.renameSync(src, dest);
      console.log("🎬 Video saved:", dest);
    } catch (e) {
      console.log("🎬 Video (raw path):", e.message);
    }
  }
}
