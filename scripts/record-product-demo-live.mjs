/**
 * Records a broad, non-destructive live-site product demo for The Raising Club.
 *
 * Covers:
 * - Public membership/plans
 * - Parent dashboard, events, courses, marketplace, settings/membership
 * - Caregiver jobs, profile, applications, chat
 * - Organization event management
 * - Admin plans, courses, marketplace
 *
 * Run from web/:
 *   $env:BASE="https://theraisingclub.com"
 *   $env:QA_PASSWORD="RaisingQA!2026"
 *   node --env-file=.env.local scripts/record-product-demo-live.mjs
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
const DWELL = 2600;

const accounts = {
  parent: { email: "qa-parent@raisingclub-test.dev", password: QA_PASSWORD },
  caregiver: { email: "qa-caregiver@raisingclub-test.dev", password: QA_PASSWORD },
  org: { email: "qa-org@raisingclub-test.dev", password: QA_PASSWORD },
  admin: { email: "qa-admin@raisingclub-test.dev", password: QA_PASSWORD },
};

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

async function goto(pathname, waitFor = "domcontentloaded") {
  await page.goto(`${BASE}${pathname}`, { waitUntil: waitFor, timeout: 60000 });
}

async function maybeClick(locator, timeout = 3500) {
  await locator.waitFor({ timeout }).catch(() => {});
  if (await locator.isVisible().catch(() => false)) {
    await locator.click();
    return true;
  }
  return false;
}

async function signIn(role) {
  const { email, password } = accounts[role];
  await goto("/sign-in");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await sleep(500);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL((url) => !url.pathname.endsWith("/sign-in"), { timeout: 60000 });
  await sleep(1800);
}

async function signOut() {
  await maybeClick(page.getByRole("button", { name: /log out/i }), 2500);
  await sleep(1200);
}

async function firstVisibleClick(candidates) {
  for (const locator of candidates) {
    if (await maybeClick(locator, 1200)) return true;
  }
  return false;
}

try {
  await step("Public membership page", async () => {
    await goto("/membership");
    await page.getByRole("heading", { name: /memberships/i }).first().waitFor({ timeout: 30000 });
    await sleep(2000);
  }, 4500);

  await step("Show family plans and annual billing", async () => {
    await firstVisibleClick([
      page.getByRole("button", { name: /family/i }),
      page.getByRole("button", { name: /families/i }),
    ]);
    await sleep(1100);
    await maybeClick(page.getByRole("button", { name: /annual/i }), 3000);
  }, 4200);

  await step("Show center/program plans", async () => {
    await firstVisibleClick([
      page.getByRole("button", { name: /centers/i }),
      page.getByRole("button", { name: /programs/i }),
      page.getByRole("button", { name: /organization/i }),
    ]);
  }, 4200);

  await step("Sign in as parent", async () => {
    await signIn("parent");
    await goto("/dashboard");
    await page.waitForLoadState("domcontentloaded");
  }, 4200);

  await step("Parent browses events", async () => {
    await goto("/events");
    await page.getByRole("heading", { name: /events/i }).first().waitFor({ timeout: 30000 });
    await sleep(1400);
    const firstEvent = page.locator('a[href^="/events/"]').filter({ hasNotText: /my events|browse/i }).first();
    if (await firstEvent.isVisible().catch(() => false)) {
      await firstEvent.click();
      await page.waitForURL("**/events/**", { timeout: 30000 }).catch(() => {});
    }
  }, 5200);

  await step("Parent sees My Events", async () => {
    await goto("/events/my");
    await page.waitForLoadState("domcontentloaded");
  }, 3800);

  await step("Parent browses courses", async () => {
    await goto("/courses");
    await page.getByRole("heading", { name: /courses/i }).first().waitFor({ timeout: 30000 });
    await sleep(1400);
    const firstCourse = page.locator('a[href^="/courses/"]').filter({ hasNotText: /my courses|browse/i }).first();
    if (await firstCourse.isVisible().catch(() => false)) {
      await firstCourse.click();
      await page.waitForURL("**/courses/**", { timeout: 30000 }).catch(() => {});
    }
  }, 5200);

  await step("Parent sees My Courses", async () => {
    await goto("/courses/my");
    await page.waitForLoadState("domcontentloaded");
  }, 3800);

  await step("Parent browses caregivers", async () => {
    await goto("/connect");
    await page.getByRole("heading", { name: /find caregivers/i }).waitFor({ timeout: 30000 });
    await sleep(1400);
    await firstVisibleClick([
      page.getByRole("button", { name: /view profile/i }).first(),
      page.getByRole("button", { name: /profile/i }).first(),
      page.locator("article, section").filter({ hasText: /caregiver|experience|available/i }).first(),
    ]);
  }, 5200);

  await step("Parent reviews care posts and settings membership", async () => {
    await goto("/dashboard/posts");
    await page.waitForLoadState("domcontentloaded");
    await sleep(2000);
    await goto("/dashboard/settings");
    await page.waitForLoadState("domcontentloaded");
  }, 5200);

  await step("Switch to caregiver account", async () => {
    await signOut();
    await signIn("caregiver");
  }, 3500);

  await step("Caregiver finds care roles", async () => {
    await goto("/jobs");
    await page.getByRole("heading", { name: /jobs|care roles|find/i }).first().waitFor({ timeout: 30000 });
    await sleep(1500);
    const firstJob = page.locator('a[href^="/jobs/"]').first();
    if (await firstJob.isVisible().catch(() => false)) {
      await firstJob.click();
      await page.waitForURL("**/jobs/**", { timeout: 30000 }).catch(() => {});
    }
  }, 5200);

  await step("Caregiver profile and applications", async () => {
    await goto("/profile");
    await page.waitForLoadState("domcontentloaded");
    await sleep(2500);
    await goto("/dashboard/applications");
    await page.waitForLoadState("domcontentloaded");
  }, 5600);

  await step("Caregiver messaging", async () => {
    await goto("/chat");
    await page.waitForLoadState("domcontentloaded");
  }, 3600);

  await step("Switch to organization account", async () => {
    await signOut();
    await signIn("org");
  }, 3500);

  await step("Organization manages events", async () => {
    await goto("/manage/events");
    await page.getByRole("heading", { name: /events/i }).first().waitFor({ timeout: 30000 });
    await sleep(1600);
    await firstVisibleClick([
      page.getByRole("link", { name: /create|new event/i }).first(),
      page.locator('a[href="/manage/events/new"]').first(),
    ]);
    await page.waitForURL("**/manage/events/new", { timeout: 15000 }).catch(() => {});
  }, 5600);

  await step("Switch to admin account", async () => {
    await signOut();
    await signIn("admin");
  }, 3500);

  await step("Admin plans console", async () => {
    await goto("/admin/plans");
    await page.getByRole("heading", { name: /membership plans/i }).waitFor({ timeout: 30000 });
    await sleep(1800);
    const editPlan = page.locator('a[href^="/admin/plans/"][href$="/edit"]').first();
    if (await editPlan.isVisible().catch(() => false)) {
      await editPlan.click();
      await page.waitForURL("**/admin/plans/**/edit", { timeout: 30000 }).catch(() => {});
    }
  }, 5600);

  await step("Admin courses and marketplace", async () => {
    await goto("/admin/courses");
    await page.waitForLoadState("domcontentloaded");
    await sleep(2600);
    await goto("/admin/marketplace");
    await page.waitForLoadState("domcontentloaded");
  }, 5600);

  await step("Closing dashboard/admin view", async () => {
    await goto("/admin");
    await page.waitForLoadState("domcontentloaded");
  }, 4200);

  console.log("\n✅ Product demo recording pass complete.");
} catch (e) {
  console.error("\n❌ Recording failed:", e.message);
  await page.screenshot({ path: path.join(OUT, `product-demo-live-FAILURE-${ts}.png`), fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  const video = page.video();
  await context.close();
  await browser.close();
  if (video) {
    try {
      const src = await video.path();
      const dest = path.join(OUT, `product-demo-live-${ts}.webm`);
      fs.renameSync(src, dest);
      console.log("🎬 Video saved:", dest);
    } catch (e) {
      console.log("🎬 Video raw path unavailable:", e.message);
    }
  }
}
