/**
 * Records an admin CREATING A COURSE end-to-end, then opening the new
 * admin-only PREVIEW (lessons, "Pause & Notice" revision question, and the quiz
 * answer key). Signed in as the QA admin (see ../qa-creds.md).
 *
 * The course is left as a DRAFT, so it never appears on the public /courses list.
 *
 * Run (from web/):
 *   $env:QA_PASSWORD="RaisingQA!2026"
 *   node --env-file=.env.local scripts/record-admin-course-create.mjs
 *
 * Video is written to the PROJECT ROOT (outside the public git repo).
 */
import { chromium } from "playwright";
import path from "path";
import fs from "fs";

const BASE = process.env.BASE || "http://localhost:3000";
const EMAIL = process.env.QA_EMAIL || "qa-admin@raisingclub-test.dev";
const PASSWORD = process.env.QA_PASSWORD || "RaisingQA!2026";

const OUT = path.resolve(process.cwd(), ".."); // project root
const ts = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const DWELL = 2600;
const TYPE = 30;

const COURSE_TITLE = `Foundations of Calm Caregiving (demo ${ts.toString().slice(-4)})`;

const browser = await chromium.launch({ headless: true, slowMo: 200 });
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

// The editor's <Labeled> wraps the input in a real <label> whose accessible name
// also includes the hint text — so getByLabel(exact) is unreliable. Instead scope
// to the <label> whose span text equals `label` exactly, then take its control.
function fieldByLabel(label) {
  return page
    .locator("label")
    .filter({ has: page.getByText(label, { exact: true }) })
    .locator("input, textarea, select")
    .first();
}

async function fillLabel(label, value, seq = false) {
  const input = fieldByLabel(label);
  await input.scrollIntoViewIfNeeded();
  await input.click();
  if (seq) await input.pressSequentially(value, { delay: TYPE });
  else await input.fill(value);
}

const saveCourse = async () => {
  await page.getByRole("button", { name: /Save course/i }).click();
  await page.getByText("Saved.", { exact: true }).waitFor({ timeout: 45000 });
  await sleep(1200);
};

try {
  await step("Sign in as admin", async () => {
    await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(EMAIL);
    await page.locator('input[type="password"]').fill(PASSWORD);
    await sleep(500);
    await page.getByRole("button", { name: "Sign in" }).click();
    // Don't depend on the /dashboard -> /admin redirect (slow under load); just
    // wait until login leaves the sign-in page, then navigate explicitly.
    await page.waitForURL((u) => !u.pathname.endsWith("/sign-in"), { timeout: 60000 }).catch(() => {});
    await sleep(1500);
  });

  await step(
    "Open Courses and start a new course",
    async () => {
      await page.goto(`${BASE}/admin/courses`, { waitUntil: "domcontentloaded" });
      await page.getByRole("heading", { name: "Courses", exact: true }).waitFor();
      await sleep(1500);
      await page.getByRole("link", { name: /Create course/i }).first().click();
      await page.waitForURL("**/admin/courses/new", { timeout: 30000 });
      await sleep(800);
    },
    3200,
  );

  await step("Name the course", async () => {
    await page.getByPlaceholder(/Foundations of Infant/i).pressSequentially(COURSE_TITLE, { delay: TYPE });
    await sleep(700);
    await page.getByRole("button", { name: /Create & continue/i }).click();
    await page.waitForURL("**/admin/courses/*/edit", { timeout: 90000 });
    await fieldByLabel("Title").waitFor({ timeout: 30000 });
    await sleep(1500);
  });

  const courseId = page.url().match(/courses\/([^/]+)\/edit/)?.[1];
  if (!courseId) throw new Error("Could not read new course id from URL");

  await step("Fill the course details", async () => {
    await fillLabel("Subtitle", "Build calm, predictable days for infants and toddlers", true);
    await fillLabel("Summary", "A short foundational course on responsive, low-stress caregiving routines.");
    await fillLabel("Description", "Practical, everyday techniques for calm transitions, soothing, and connection — designed for new caregivers and educators.");
    await fillLabel("Age min (months)", "0");
    await fillLabel("Age max (months)", "36");
    await fillLabel("Est. learning (min)", "25");
    await sleep(600);
  });

  await step("Save the details", saveCourse, 2200);

  await step("Go to Chapters & modules", async () => {
    await page.getByRole("button", { name: /Chapters & modules/i }).click();
    await sleep(800);
    await page.getByRole("button", { name: /Add chapter/i }).click();
    await fieldByLabel("Chapter title").waitFor({ timeout: 10000 });
    await fieldByLabel("Chapter title").pressSequentially("Getting started with calm care", { delay: TYPE });
    await sleep(800);
  });

  await step("Add a module", async () => {
    await page.getByRole("button", { name: /Add module/i }).click();
    await fieldByLabel("Module title").waitFor({ timeout: 10000 });
    await fieldByLabel("Module title").pressSequentially("Reading your child's cues", { delay: TYPE });
    // Rich-text body (best-effort — it's a contenteditable editor).
    const editor = page.locator('[contenteditable="true"]').first();
    if (await editor.isVisible().catch(() => false)) {
      await editor.click();
      await editor.pressSequentially("Notice the small signals — yawns, gaze, fussiness — and respond before escalation. Calm starts with attention.", { delay: 10 });
    }
    await fieldByLabel("Minutes").fill("8");
    await sleep(800);
  });

  await step("Add a 'Pause & Notice' revision question", async () => {
    const toggle = page.locator("label").filter({ hasText: "question after this module" }).getByRole("checkbox");
    await toggle.scrollIntoViewIfNeeded();
    await toggle.check();
    await page.getByPlaceholder("What feels most true for you right now?").pressSequentially(
      "When your child gets fussy before a nap, what helps you stay calm?",
      { delay: 16 },
    );
    await page.getByPlaceholder("Option 1").fill("Pause, breathe, and slow my own pace first");
    await page.getByPlaceholder("Reflection / explanation").fill("Co-regulation starts with the adult — your calm becomes their calm.");
    await page.locator("label").filter({ hasText: "highlight" }).getByRole("checkbox").check();
    await sleep(800);
  });

  await step("Save the curriculum", saveCourse, 2200);

  await step("Build the quiz", async () => {
    await page.getByRole("button", { name: /Quiz/ }).first().click();
    await sleep(700);
    await page.getByRole("button", { name: /Add quiz/i }).click();
    await fieldByLabel("Intro copy").waitFor({ timeout: 10000 });
    await fieldByLabel("Intro copy").pressSequentially("A quick check-in on calm caregiving foundations.", { delay: 16 });
    await page.getByRole("button", { name: /Add question/i }).click();
    await page.getByPlaceholder("Question").pressSequentially("What's the first step in helping a child co-regulate?", { delay: 16 });
    await page.getByPlaceholder("Option 1").fill("Regulate your own state first");
    await page.getByPlaceholder("Explanation (shown after passing)").fill("The adult's calm is the anchor for the child's nervous system.");
    await page.getByRole("button", { name: /Add option/i }).click();
    await page.getByPlaceholder("Option 2").fill("Immediately distract the child");
    await sleep(900);
  });

  await step("Save the quiz (course stays a Draft)", saveCourse, 2200);

  await step(
    "Open the admin-only Preview",
    async () => {
      await page.goto(`${BASE}/admin/courses/${courseId}/preview`, { waitUntil: "domcontentloaded" });
      await page.getByText("Admin preview", { exact: false }).waitFor({ timeout: 20000 });
      await sleep(2500); // dwell on the learner-style course view
    },
    3500,
  );

  await step("Reveal the 'Pause & Notice' response", async () => {
    const opt = page.getByRole("button", { name: /Pause, breathe, and slow my own pace first/i });
    if (await opt.isVisible().catch(() => false)) {
      await opt.scrollIntoViewIfNeeded();
      await opt.click();
      await sleep(2000);
    }
  });

  await step(
    "Open the quiz answer key",
    async () => {
      // On the last module the main action is "Go to Integration Moment"; fall
      // back to the sidebar "Integration Moment (Quiz)" entry if needed.
      const mainBtn = page.getByRole("button", { name: /Go to Integration Moment/i });
      const sideBtn = page.getByRole("button", { name: /Integration Moment \(Quiz\)/i });
      if (await mainBtn.isVisible().catch(() => false)) {
        await mainBtn.scrollIntoViewIfNeeded();
        await mainBtn.click();
      } else {
        await sideBtn.scrollIntoViewIfNeeded();
        await sideBtn.click();
      }
      await page.getByText(/Answer key/i).waitFor({ timeout: 15000 });
      await page.mouse.wheel(0, 300);
      await sleep(3000);
    },
    4000,
  );

  console.log("\n✅ Course creation + preview demo complete. Course left as DRAFT:", COURSE_TITLE);
} catch (e) {
  console.error("\n❌ Recording failed:", e.message);
  await page.screenshot({ path: path.join(OUT, `admin-course-FAILURE-${ts}.png`), fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    try {
      const src = await video.path();
      const dest = path.join(OUT, `admin-course-creation-demo-${ts}.webm`);
      fs.renameSync(src, dest);
      console.log("🎬 Video saved:", dest);
    } catch (e) {
      console.log("🎬 Video (raw path):", e.message);
    }
  }
}
