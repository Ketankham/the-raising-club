/**
 * Records a user-facing product overview:
 * landing page -> courses -> course enrollment -> events -> marketplace overview.
 *
 * This intentionally avoids admin-heavy screens and does not start on membership.
 *
 * Run from web/:
 *   $env:BASE="https://theraisingclub.com"
 *   $env:QA_PASSWORD="RaisingQA!2026"
 *   node --env-file=.env.local scripts/record-user-product-overview-live.mjs
 */
import { chromium } from "../../qa-recordings/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = (process.env.BASE || "https://theraisingclub.com").replace(/\/$/, "");
const QA_PASSWORD = process.env.QA_PASSWORD || "RaisingQA!2026";
const OUT = path.resolve(process.cwd(), "..", "_recordings");
fs.mkdirSync(OUT, { recursive: true });

const ts = Date.now();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const DWELL = 2800;

const parent = {
  email: "qa-parent@raisingclub-test.dev",
  password: QA_PASSWORD,
};

const browser = await chromium.launch({ headless: true, slowMo: 170 });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  recordVideo: { dir: OUT, size: { width: 1440, height: 900 } },
});
const page = await context.newPage();

page.on("console", (m) => {
  if (m.type() === "error" && !/404/.test(m.text())) console.log("  [console]", m.text());
});

async function step(label, fn, dwell = DWELL) {
  console.log("▶", label);
  await fn();
  await sleep(dwell);
}

async function goto(pathname) {
  await page.goto(`${BASE}${pathname}`, { waitUntil: "domcontentloaded", timeout: 60000 });
}

async function signIn() {
  await goto("/sign-in");
  const email = page.locator("input:visible").nth(0);
  const password = page.locator("input:visible").nth(1);
  await email.waitFor({ timeout: 30000 });
  await email.click();
  await email.pressSequentially(parent.email, { delay: 5 });
  await password.click();
  await password.pressSequentially(parent.password, { delay: 5 });
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/sign-in"), { timeout: 60000 });
}

async function clickFirstRealCourse() {
  const links = page.locator('a[href^="/courses/"]');
  const count = await links.count();
  for (let i = 0; i < count; i += 1) {
    const href = await links.nth(i).getAttribute("href");
    const text = (await links.nth(i).innerText().catch(() => "")).toLowerCase();
    if (!href || href.includes("/my") || href.includes("/quiz") || href.includes("/certificate")) continue;
    if (/course|care|child|learn|free|start|foundation|training/.test(text) || href.split("/").length >= 3) {
      await links.nth(i).click();
      await page.waitForURL("**/courses/**", { timeout: 30000 }).catch(() => {});
      return true;
    }
  }
  return false;
}

async function tryEnrollCourse() {
  const enroll = page.getByRole("button", { name: /enroll & start|start course|continue|resume/i }).first();
  const buy = page.getByRole("button", { name: /buy & enroll/i }).first();
  if (await enroll.isVisible().catch(() => false)) {
    await enroll.click();
    await sleep(3000);
    return "clicked enroll/start";
  }
  if (await buy.isVisible().catch(() => false)) {
    return "paid course shown; skipped checkout";
  }
  return "course detail shown; no enrollment CTA visible";
}

async function clickFirstEvent() {
  const links = page.locator('a[href^="/events/"]');
  const count = await links.count();
  for (let i = 0; i < count; i += 1) {
    const href = await links.nth(i).getAttribute("href");
    if (!href || href.includes("/my") || href.includes("/register")) continue;
    await links.nth(i).click();
    await page.waitForURL("**/events/**", { timeout: 30000 }).catch(() => {});
    return true;
  }
  return false;
}

async function showMarketplaceFilters() {
  const filterHeading = page.getByRole("heading", { name: /filters/i }).first();
  await filterHeading.waitFor({ timeout: 30000 }).catch(() => {});
  const careChip = page.getByRole("button", { name: /babysit|nanny|after|care/i }).first();
  if (await careChip.isVisible().catch(() => false)) {
    await careChip.click();
    await sleep(1200);
  }
  await page.getByLabel(/maximum child age/i).fill("96").catch(() => {});
}

try {
  await step("Landing page", async () => {
    await goto("/");
    await page.waitForLoadState("domcontentloaded");
    await sleep(2200);
    await page.mouse.wheel(0, 520);
  }, 5200);

  await step("Courses catalog", async () => {
    await goto("/courses");
    await page.getByRole("heading", { name: /courses|training/i }).first().waitFor({ timeout: 30000 });
    await sleep(2000);
  }, 4700);

  await step("Sign in as parent for course registration", async () => {
    await signIn();
    await goto("/courses");
    await page.waitForLoadState("domcontentloaded");
  }, 3500);

  await step("Open a course detail", async () => {
    const opened = await clickFirstRealCourse();
    if (!opened) throw new Error("No course link found on /courses");
    await sleep(2000);
  }, 4600);

  await step("Register/enroll for the course", async () => {
    const outcome = await tryEnrollCourse();
    console.log("  course:", outcome);
  }, 5200);

  await step("Show My Courses", async () => {
    await goto("/courses/my");
    await page.waitForLoadState("domcontentloaded");
  }, 4300);

  await step("Events catalog", async () => {
    await goto("/events");
    await page.getByRole("heading", { name: /events/i }).first().waitFor({ timeout: 30000 });
    await sleep(1800);
  }, 4700);

  await step("Open an event detail", async () => {
    await clickFirstEvent();
  }, 5200);

  await step("Show My Events", async () => {
    await goto("/events/my");
    await page.waitForLoadState("domcontentloaded");
  }, 4200);

  await step("Marketplace caregiver listings", async () => {
    await goto("/connect");
    await page.getByRole("heading", { name: /find caregivers/i }).waitFor({ timeout: 30000 });
    await showMarketplaceFilters();
  }, 5600);

  await step("Marketplace care posts", async () => {
    await goto("/dashboard/posts");
    await page.getByRole("heading", { name: /my care posts/i }).waitFor({ timeout: 30000 });
  }, 4300);

  await step("Marketplace messaging", async () => {
    await goto("/chat");
    await page.waitForLoadState("domcontentloaded");
  }, 4300);

  await step("Close on parent dashboard", async () => {
    await goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
  }, 4200);

  console.log("\n✅ User-facing product overview recording complete.");
} catch (e) {
  console.error("\n❌ Recording failed:", e.message);
  await page.screenshot({ path: path.join(OUT, `user-product-overview-FAILURE-${ts}.png`), fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    try {
      const src = await video.path();
      const dest = path.join(OUT, `user-product-overview-live-${ts}.webm`);
      fs.renameSync(src, dest);
      console.log("🎬 Video saved:", dest);
    } catch (e) {
      console.log("🎬 Video raw path unavailable:", e.message);
    }
  }
}
