/**
 * Records a screen-capture video demonstrating the CAREGIVER PROFILE editing
 * flow, signed in as the QA caregiver account (see ../qa-creds.md).
 *
 * It signs in, opens /profile, and demonstrates inline editing of several
 * sections (About me, Languages, Skills, Availability) — clicking "Edit",
 * changing fields, and "Save" (each shows a "Changes saved" toast).
 *
 * Run (from web/):
 *   $env:QA_PASSWORD="RaisingQA!2026"
 *   node --env-file=.env.local scripts/record-caregiver-profile.mjs
 *
 * Optional: BASE=https://<vercel-url> to record against production instead of
 * the local dev server. Video is written to the PROJECT ROOT (one level above
 * web/, which is NOT a git repo) so it never lands in the public repo.
 */
import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE = process.env.BASE || "http://localhost:3000";
const EMAIL = process.env.QA_EMAIL || "qa-caregiver@raisingclub-test.dev";
const PASSWORD = process.env.QA_PASSWORD || "RaisingQA!2026";

const OUT = path.resolve(process.cwd(), ".."); // project root (outside the git repo)
const ts = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DWELL = 3000; // pause after each step (room for a voiceover)
const TYPE = 45; // per-character typing delay (ms)

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

// A profile section card, located by its exact heading text.
const card = (name) =>
  page.locator("section").filter({ has: page.getByRole("heading", { name, exact: true }) }).first();

async function editAndSave(name, fill) {
  const c = card(name);
  await c.scrollIntoViewIfNeeded();
  await sleep(600);
  await c.getByRole("button", { name: "Edit" }).click();
  await sleep(900);
  await fill(c);
  await sleep(1200);
  await c.getByRole("button", { name: "Save" }).click();
  await page.getByText("Changes saved").waitFor({ timeout: 15000 });
  await sleep(1500);
}

try {
  await step("Sign in as the caregiver", async () => {
    await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await sleep(700);
    await page.getByRole("button", { name: "Sign in" }).click();
    await page.waitForURL("**/dashboard", { timeout: 40000 });
    await sleep(1500);
  });

  await step("Skip the welcome tour if it appears", async () => {
    const skip = page.getByRole("button", { name: /Skip the tour/i });
    await skip.waitFor({ timeout: 6000 }).catch(() => {});
    if (await skip.isVisible().catch(() => false)) {
      await skip.click();
      await sleep(1000);
    }
  });

  await step(
    "Open your Caregiver Profile",
    async () => {
      await page.goto(`${BASE}/profile`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "About me", exact: true }).waitFor({ timeout: 30000 });
      await sleep(2500); // dwell on the full profile
    },
    4000,
  );

  await step("Edit the About me section", async () => {
    await editAndSave("About me", async (c) => {
      const headline = c.locator("input").first();
      await headline.click();
      await headline.fill("");
      await headline.pressSequentially("Infant & Toddler Caregiver · Calm, playful routines", { delay: TYPE });
      const about = c.locator("textarea").first();
      await about.click();
      await about.fill("");
      await about.pressSequentially(
        "I create calm, predictable days full of play, books, and outdoor time — and I keep families looped in with simple daily notes.",
        { delay: 14 },
      );
    });
  });

  await step("Update Languages", async () => {
    await editAndSave("Languages", async (c) => {
      const input = c.locator("input").first();
      await input.click();
      await input.fill("");
      await input.pressSequentially("English, Spanish", { delay: TYPE });
    });
  });

  await step("Adjust Skills", async () => {
    await editAndSave("Skills", async (c) => {
      // Toggle the first care-setting option to show a multi-select edit.
      await c.getByRole("checkbox").first().click();
    });
  });

  await step("Set Availability (Snapshot)", async () => {
    await editAndSave("Snapshot", async (c) => {
      await c.getByRole("checkbox").first().click();
      await sleep(400);
      await c.getByRole("checkbox").nth(1).click();
    });
  });

  await step(
    "Show the finished, saved profile",
    async () => {
      await page.mouse.wheel(0, -1200);
      await sleep(2500);
    },
    4000,
  );

  console.log("\n✅ Caregiver profile editing demo complete.");
} catch (e) {
  console.error("\n❌ Recording failed:", e.message);
  await page.screenshot({ path: path.join(OUT, `caregiver-profile-FAILURE-${ts}.png`), fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  const video = page.video();
  await context.close(); // flush the recording to disk
  await browser.close();
  if (video) {
    try {
      const src = await video.path();
      const dest = path.join(OUT, `caregiver-profile-edit-demo-${ts}.webm`);
      fs.renameSync(src, dest);
      console.log("🎬 Video saved:", dest);
    } catch (e) {
      console.log("🎬 Video (raw path):", e.message);
    }
  }
}
