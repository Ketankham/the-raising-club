/**
 * Records a detailed live marketplace demo:
 * parent creates a job -> caregiver searches/filters/applies -> parent reviews
 * and shortlists applicant -> parent and caregiver chat.
 *
 * Run from web/:
 *   $env:BASE="https://theraisingclub.com"
 *   node --env-file=.env.local scripts/record-marketplace-detail-live.mjs
 */
import { chromium } from "../../qa-recordings/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = (process.env.BASE || "https://theraisingclub.com").replace(/\/$/, "");
const OUT = path.resolve(process.cwd(), "..", "_recordings");
fs.mkdirSync(OUT, { recursive: true });

const ts = Date.now();
const tag = String(ts).slice(-5);
const JOB_TITLE = `Demo After-school Care Role ${tag}`;
const PARENT_MSG = `Hi, thanks for applying to ${JOB_TITLE}. Could you share your weekday availability?`;
const CAREGIVER_MSG = `Absolutely. I am available Monday through Thursday after school and would love to talk more.`;

const accounts = {
  parent: { email: "marketplace-test-parent@raisingclub-test.dev", password: "TestPass#2026" },
  caregiver: { email: "marketplace-test-caregiver@raisingclub-test.dev", password: "TestPass#2026" },
};

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DWELL = 2600;
const TYPE = 28;

const browser = await chromium.launch({ headless: true, slowMo: 180 });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

page.on("console", (m) => {
  if (m.type() === "error") console.log("  [console]", m.text());
});

async function step(label, fn, dwell = DWELL) {
  console.log("▶", label);
  await fn();
  await sleep(dwell);
}

async function goto(pathname) {
  await page.goto(`${BASE}${pathname}`, { waitUntil: "domcontentloaded", timeout: 60000 });
}

async function maybeClick(locator, timeout = 3000) {
  await locator.waitFor({ timeout }).catch(() => {});
  if (await locator.isVisible().catch(() => false)) {
    await locator.click();
    return true;
  }
  return false;
}

async function signIn(role) {
  const account = accounts[role];
  await goto("/sign-in");
  await page.getByLabel(/email/i).fill(account.email);
  await page.getByLabel(/password/i).fill(account.password);
  await sleep(500);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/sign-in"), { timeout: 60000 });
  await sleep(1800);
}

async function signOut() {
  await maybeClick(page.getByRole("button", { name: /log out/i }), 2500);
  await sleep(1200);
}

async function fillPlaceholder(pattern, value, sequential = false) {
  const input = page.getByPlaceholder(pattern).first();
  await input.waitFor({ timeout: 20000 });
  if (sequential) await input.pressSequentially(value, { delay: TYPE });
  else await input.fill(value);
}

async function chooseChip(patterns, fallbackIndex = 0) {
  for (const pattern of patterns) {
    const button = page.getByRole("button", { name: pattern }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      return;
    }
  }
  await page.locator('button[type="button"]').nth(fallbackIndex).click();
}

async function sendChatMessage(body) {
  let box = page.getByPlaceholder(/write a message/i);
  if (!(await box.isVisible().catch(() => false))) {
    await page.locator('a[href^="/chat?c="]').first().click();
    await page.waitForURL("**/chat?c=**", { timeout: 30000 }).catch(() => {});
    box = page.getByPlaceholder(/write a message/i);
  }
  await box.waitFor({ timeout: 30000 });
  await box.fill(body);
  await page.keyboard.press("Enter");
  await page.getByText(body).first().waitFor({ timeout: 30000 });
}

try {
  await step("Parent signs in and opens My Care Posts", async () => {
    await signIn("parent");
    await goto("/dashboard/posts");
    await page.waitForLoadState("domcontentloaded");
  }, 4200);

  await step("Parent starts a new job post", async () => {
    await maybeClick(page.getByRole("link", { name: /post a job|new|create/i }).first(), 5000);
    await page.waitForURL("**/dashboard/posts/new", { timeout: 30000 });
  }, 3200);

  await step("Parent fills the job basics", async () => {
    await fillPlaceholder(/after-school care/i, JOB_TITLE, true);
    await fillPlaceholder(/describe the care/i, "We are looking for a warm caregiver for school pickup, snacks, homework rhythm, and play until early evening.", true);
    await chooseChip([/babysit/i, /nanny/i, /after/i, /recurring/i], 0);
    await sleep(700);
    await chooseChip([/school/i, /child/i, /preschool/i, /toddler/i], 1);
  }, 5600);

  await step("Parent adds schedule, pay, location, and filters-relevant details", async () => {
    await chooseChip([/after school/i, /weekday/i, /part/i, /afternoon/i], 2);
    await fillPlaceholder(/specifics/i, "Mon-Thu, 3-6pm");
    await page.locator('input[type="number"]').nth(0).fill("28").catch(() => {});
    await page.locator('input[type="number"]').nth(1).fill("34").catch(() => {});
    await page.locator('input[type="number"]').nth(2).fill("12").catch(() => {});
    await fillPlaceholder(/brooklyn/i, "Brooklyn, NY");
    await fillPlaceholder(/11215/i, "11215");
    await page.locator('input[type="date"]').first().fill("2026-07-20").catch(() => {});
  }, 5600);

  await step("Parent posts the job", async () => {
    await page.getByRole("button", { name: /post job/i }).click();
    await page.waitForURL("**/dashboard/posts", { timeout: 60000 });
    await page.getByText(JOB_TITLE).waitFor({ timeout: 30000 });
  }, 5000);

  await step("Parent briefly shows caregiver marketplace filters", async () => {
    await goto("/connect");
    await page.getByRole("heading", { name: /find caregivers/i }).waitFor({ timeout: 30000 });
    await sleep(1200);
    await chooseChip([/babysit/i, /nanny/i, /after/i], 0);
    await page.getByLabel(/maximum child age/i).fill("96").catch(() => {});
  }, 5000);

  await step("Caregiver signs in", async () => {
    await signOut();
    await signIn("caregiver");
  }, 3600);

  await step("Caregiver opens Find Jobs and uses filters", async () => {
    await goto("/jobs");
    await page.waitForLoadState("domcontentloaded");
    await sleep(1300);
    await chooseChip([/babysit/i, /nanny/i, /after/i], 0);
    await page.getByLabel(/maximum child age/i).fill("96").catch(() => {});
  }, 5200);

  await step("Caregiver searches for the new role", async () => {
    await goto(`/jobs?q=${encodeURIComponent(JOB_TITLE)}`);
    await page.getByText(JOB_TITLE).first().waitFor({ timeout: 45000 });
  }, 4600);

  await step("Caregiver opens the job detail", async () => {
    const card = page.locator("div").filter({ hasText: JOB_TITLE }).first();
    await card.getByRole("link", { name: /view details/i }).click();
    await page.waitForURL("**/jobs/**", { timeout: 30000 });
    await page.getByText(JOB_TITLE).first().waitFor({ timeout: 30000 });
  }, 5200);

  await step("Caregiver applies with note and rate", async () => {
    await maybeClick(page.getByRole("button", { name: /apply now|apply/i }).first(), 5000);
    await page.getByRole("heading", { name: /apply to this job/i }).waitFor({ timeout: 30000 });
    await page.getByPlaceholder(/introduce yourself/i).fill("I have experience with after-school routines, homework support, and calm transitions from school to home.");
    await page.getByPlaceholder(/28/i).fill("30");
    await sleep(1200);
    await page.getByRole("button", { name: /send application/i }).click();
    await page.getByText(/application sent/i).waitFor({ timeout: 30000 });
  }, 5600);

  await step("Caregiver reviews My Applications", async () => {
    await maybeClick(page.getByRole("button", { name: /done/i }), 4000);
    await goto("/dashboard/applications");
    await page.waitForLoadState("domcontentloaded");
  }, 4200);

  await step("Parent returns to applicants", async () => {
    await signOut();
    await signIn("parent");
    await goto("/dashboard/posts");
    await page.getByText(JOB_TITLE).waitFor({ timeout: 30000 });
    await page.locator('a[href*="/dashboard/posts/"][href*="/applicants"]').first().click();
    await page.waitForURL("**/dashboard/posts/**/applicants", { timeout: 30000 });
  }, 5600);

  await step("Parent reviews applicant and shortlists", async () => {
    await page.getByRole("heading", { name: /applicants/i }).waitFor({ timeout: 30000 });
    await page.getByText(/proposed rate/i).first().waitFor({ timeout: 30000 });
    await sleep(1800);
    await maybeClick(page.getByRole("button", { name: /shortlist/i }).first(), 5000);
  }, 5600);

  await step("Parent starts the chat", async () => {
    await maybeClick(page.getByRole("link", { name: /message/i }).first(), 5000);
    await page.waitForURL("**/chat**", { timeout: 30000 });
    await sendChatMessage(PARENT_MSG);
  }, 5600);

  await step("Caregiver replies in chat", async () => {
    await signOut();
    await signIn("caregiver");
    await goto("/chat");
    await page.waitForLoadState("domcontentloaded");
    const convo = page.getByText(/marketplace|parent|pat|family|conversation/i).first();
    if (await convo.isVisible().catch(() => false)) await convo.click();
    else await page.locator('a[href^="/chat?c="]').first().click();
    await page.waitForURL("**/chat?c=**", { timeout: 30000 }).catch(() => {});
    await page.getByText(PARENT_MSG).first().waitFor({ timeout: 30000 }).catch(() => {});
    await sendChatMessage(CAREGIVER_MSG);
  }, 6200);

  await step("Parent sees the caregiver reply", async () => {
    await signOut();
    await signIn("parent");
    await goto("/chat");
    await page.waitForLoadState("domcontentloaded");
    const convo = page.getByText(/caregiver|marketplace|conversation/i).first();
    if (await convo.isVisible().catch(() => false)) await convo.click();
    else await page.locator('a[href^="/chat?c="]').first().click();
    await page.getByText(CAREGIVER_MSG).first().waitFor({ timeout: 30000 }).catch(() => {});
  }, 5600);

  console.log("\n✅ Marketplace detail recording complete.");
  console.log("   Demo job:", JOB_TITLE);
} catch (e) {
  console.error("\n❌ Marketplace recording failed:", e.message);
  await page.screenshot({ path: path.join(OUT, `marketplace-detail-FAILURE-${ts}.png`), fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    try {
      const src = await video.path();
      const dest = path.join(OUT, `marketplace-detail-live-${ts}.webm`);
      fs.renameSync(src, dest);
      console.log("🎬 Video saved:", dest);
    } catch (e) {
      console.log("🎬 Video raw path unavailable:", e.message);
    }
  }
}
