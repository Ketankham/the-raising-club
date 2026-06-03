/**
 * Records a screen-capture video of the full ORGANIZATION journey on the live
 * site: onboarding (role -> ways to use -> account -> program details -> goals
 * -> done) and then creating an event. The demo event is left as a DRAFT, so it
 * never appears on the public /events list.
 *
 * Run:  BASE=https://the-raising-club.vercel.app node scripts/record-org-flow.mjs
 * Video is written to <repo-root>/../_recordings (outside the git repo).
 */
import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE = process.env.BASE || "https://the-raising-club.vercel.app";
const OUT = path.resolve(process.cwd(), "..", "_recordings");
fs.mkdirSync(OUT, { recursive: true });

const ts = Date.now();
// GoTrue rejects reserved demo domains (example.com/test.com). Use a real-MX
// domain; no mail is actually read (account is only used for this demo run).
const email = `trc.demo.org.${ts}@gmail.com`;
const password = "DemoOrg!2026";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Pacing — kept deliberately slow so a voiceover can be laid over the video.
const DWELL = 3500; // default pause after each step
const TYPE = 55; // per-character typing delay (ms)

const browser = await chromium.launch({ headless: true, slowMo: 250 });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();
page.on("console", (m) => m.type() === "error" && console.log("  [console]", m.text()));

async function step(label, fn, dwell = DWELL) {
  console.log("▶", label);
  await fn();
  await sleep(dwell); // let the viewer (and voiceover) catch up
}

try {
  await step("Open onboarding", async () => {
    await page.goto(`${BASE}/onboarding`, { waitUntil: "domcontentloaded" });
    await page.waitForURL("**/onboarding/role-select", { timeout: 40000 });
    await page.getByRole("button", { name: "Continue", exact: true }).waitFor();
  });

  await step("Choose the Organization role", async () => {
    await page.locator("button[aria-pressed]").filter({ hasText: "Program / Organization" }).click();
    await sleep(700);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL("**/onboarding/ways-to-use", { timeout: 30000 });
  });

  await step(
    "Ways to use The Raising Club",
    async () => {
      await sleep(2500); // dwell so the three value cards can be narrated
      await page.getByRole("button", { name: "Begin Profile" }).click();
      await page.waitForURL("**/onboarding/profile", { timeout: 30000 });
    },
    4500,
  );

  await step("Fill profile and create the account", async () => {
    await page.getByLabel("First name").pressSequentially("Avery", { delay: TYPE });
    await page.getByLabel("Last name").pressSequentially("Nguyen", { delay: TYPE });
    await page.getByLabel("School or organization name").pressSequentially("Sunrise Learning Studio", { delay: TYPE });
    await page.getByLabel("Email").pressSequentially(email, { delay: 25 });
    await page.getByLabel("Password").fill(password);
    await page.getByLabel("ZIP code").fill("11201");
    await page.getByLabel("Phone number").fill("555-0142");
    await sleep(800);
    await page.locator("input[type=checkbox]").first().check();
    await sleep(1200);
    await page.getByRole("button", { name: "Create Account" }).click();
    // Either advance, or surface the inline error (e.g. invalid email) instead
    // of a blind timeout.
    const advanced = page.waitForURL("**/onboarding/program-details", { timeout: 40000 });
    const errored = page
      .locator("p.text-red-600")
      .first()
      .waitFor({ state: "visible", timeout: 40000 })
      .then(async () => {
        const msg = await page.locator("p.text-red-600").first().textContent();
        throw new Error(`Account creation error: ${msg?.trim()}`);
      });
    await Promise.race([advanced, errored]);
  });

  await step("Describe the program", async () => {
    await page.getByRole("checkbox", { name: /Daycare/ }).click();
    await page.getByRole("checkbox", { name: /Toddlers/ }).click();
    await page.getByRole("radio", { name: /^1.5 staff$/ }).click();
    await page.getByRole("radio", { name: /Single location/ }).click();
    await sleep(700);
    await page.getByRole("button", { name: "Continue", exact: true }).click();
    await page.waitForURL("**/onboarding/goals", { timeout: 30000 });
  });

  await step("Pick goals", async () => {
    await page.getByRole("checkbox", { name: /Create event registration pages/ }).click();
    await sleep(600);
    await page.getByRole("button", { name: "Finish Setup" }).click();
    await page.waitForURL("**/onboarding/complete", { timeout: 30000 });
  });

  await step(
    "Finish onboarding -> dashboard",
    async () => {
      await sleep(2000); // dwell on the "Your program profile is ready" screen
      await page.getByRole("button", { name: "Go to my dashboard" }).click();
      await page.waitForURL("**/dashboard", { timeout: 40000 });
      await sleep(2500); // let the org dashboard + welcome tour appear
    },
    4500,
  );

  await step("Skip the welcome tour", async () => {
    // First-run dashboard tour overlays the screen — show it briefly, then skip.
    const skip = page.getByRole("button", { name: "Skip the tour" });
    await skip.waitFor({ timeout: 8000 }).catch(() => {});
    if (await skip.isVisible().catch(() => false)) {
      await sleep(2500);
      await skip.click();
      await sleep(1500);
    }
  });

  await step(
    "Open Events from the left sidebar",
    async () => {
      // Navigate the way a real user would: click "Events" in the left sidebar.
      await page.locator('aside a[href="/manage/events"]').first().click();
      await page.waitForURL("**/manage/events", { timeout: 30000 });
      await sleep(2000);
    },
    4000,
  );

  await step("Start a new event", async () => {
    await page.locator('a[href="/manage/events/new"]').first().click();
    await page.waitForURL("**/manage/events/new", { timeout: 30000 });
    await page.getByLabel("Title").waitFor();
    await sleep(600);
  });

  await step("Fill the event form (kept as Draft)", async () => {
    await page.getByLabel("Title").pressSequentially("Toddler Music & Movement (demo)", { delay: TYPE });
    await sleep(500);
    await page.getByLabel("Short summary").pressSequentially("A joyful 45-minute music and movement class for toddlers and a grown-up.", { delay: 15 });
    await page.getByLabel("What to expect").fill("Songs, instruments, parachute play, and bubbles — designed for ages 1–3 with a caregiver.");
    await sleep(800);
    await page.getByLabel("Starts").fill("2026-07-15T10:00");
    await page.getByLabel("Ends", { exact: true }).fill("2026-07-15T10:45");
    await page.getByLabel("Min age (months)").fill("12");
    await page.getByLabel("Max age (months)").fill("36");
    await page.getByLabel("Neighborhood (shown first)").fill("Brooklyn");
    await sleep(2000);
  });

  await step(
    "Create the event",
    async () => {
      await page.getByRole("button", { name: "Create event" }).click();
      await page.waitForURL("**/manage/events/**/roster", { timeout: 40000 });
      await sleep(4000); // land on the roster / management screen
    },
    4000,
  );

  await step(
    "Review the roster, attendance & participant stats",
    async () => {
      // The roster page shows registrations, attendance and capacity — visible to
      // the org owner. New draft has none yet, but the management view is here.
      await page.mouse.wheel(0, 250);
      await sleep(2500);
      await page.mouse.wheel(0, -250);
      await sleep(1500);
    },
    4000,
  );

  await step("Open the event to edit it", async () => {
    await page.getByRole("link", { name: "Edit" }).click();
    await page.waitForURL("**/manage/events/**/edit", { timeout: 30000 });
    await page.getByLabel("Title").waitFor();
    await sleep(2500);
  });

  await step(
    "Make an edit and save",
    async () => {
      const summary = page.getByLabel("Short summary");
      await summary.click();
      await summary.fill("");
      await summary.pressSequentially(
        "Updated — a joyful 45-minute music & movement class for toddlers and a grown-up.",
        { delay: 18 },
      );
      await sleep(1500);
      await page.getByRole("button", { name: "Save changes" }).click();
      await page.waitForURL("**/manage/events/**/roster", { timeout: 30000 });
      await sleep(3500);
    },
    4000,
  );

  console.log("\n✅ Flow complete: onboarding -> create -> roster -> edit. Event is a DRAFT.");
  console.log("   Demo org account:", email, "/", password);
} catch (e) {
  console.error("\n❌ Flow failed:", e.message);
  await page.screenshot({ path: path.join(OUT, `failure-${ts}.png`), fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  const video = page.video();
  await context.close(); // flush the recording
  await browser.close();
  if (video) {
    try {
      const src = await video.path();
      const dest = path.join(OUT, `org-onboarding-to-event-${ts}.webm`);
      fs.renameSync(src, dest);
      console.log("🎬 Video saved:", dest);
    } catch (e) {
      console.log("🎬 Video (raw):", e.message);
    }
  }
}
