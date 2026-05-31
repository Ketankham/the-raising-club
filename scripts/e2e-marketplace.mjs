// Real-browser E2E of the marketplace via Playwright (Node, not MCP). Drives the
// already-installed chromium-1217 binary. Server must be on :3200.
//   node scripts/e2e-marketplace.mjs
import { chromium } from "playwright";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const EXE = path.join(os.homedir(), "AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe");
const BASE = "http://localhost:3200";
const PW = "TestPass#2026";
const SHOTS = "D:/Projects/The Raising Club/Reference-docs/Marketplace/screenshots/test";
fs.mkdirSync(SHOTS, { recursive: true });

let ok = true;
const step = (cond, label) => { console.log(`${cond ? "✓" : "✗"} ${label}`); if (!cond) ok = false; };

const browser = await chromium.launch({ executablePath: EXE, headless: true });

async function signIn(page, email) {
  await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: "Email" }).fill(email);
  await page.getByRole("textbox", { name: "Password" }).fill(PW);
  await page.getByRole("button", { name: "Sign in" }).click();
  await page.waitForURL("**/dashboard", { timeout: 15000 });
}

try {
  // ============ PARENT ============
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await signIn(page, "mkt-demo-parent@raisingclub-test.dev");
  step(true, "parent: signed in → dashboard");

  // Find Caregivers
  await page.goto(`${BASE}/connect`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Find Caregivers" }).waitFor({ timeout: 10000 });
  const cardCount = await page.getByRole("button", { name: "View Profile" }).count();
  step(cardCount >= 3, `parent: Find Caregivers shows ${cardCount} caregiver cards`);
  await page.screenshot({ path: `${SHOTS}/01-find-caregivers.png`, fullPage: false });

  // View Profile drawer — detect the one slid on-screen (others sit off-screen via translate-x-full)
  const onScreenDialog = () =>
    page.evaluate(() => {
      const w = window.innerWidth;
      return [...document.querySelectorAll('[role="dialog"]')].some((el) => {
        const r = el.getBoundingClientRect();
        return r.left < w - 200 && r.width > 100;
      });
    });
  step(!(await onScreenDialog()), "parent: no drawer open before clicking");
  await page.getByRole("button", { name: "View Profile" }).first().click();
  await page.waitForTimeout(600);
  step(await onScreenDialog(), "parent: View Profile opens slide-over drawer");
  await page.screenshot({ path: `${SHOTS}/02-profile-drawer.png` });
  await page.keyboard.press("Escape");
  await page.waitForTimeout(500);

  // Invite to Co-Hire — target Maya's card (so the caregiver step sees the invite)
  const mayaCard = page.locator('[class*="bg-mint"]').filter({ hasText: "Maya H." }).first();
  await mayaCard.getByRole("button", { name: "Invite", exact: true }).click();
  await page.getByRole("heading", { name: "Invite to Co-Hire" }).waitFor({ timeout: 5000 });
  step(true, "parent: Invite opens co-hire modal");
  await page.screenshot({ path: `${SHOTS}/03-cohire-modal.png` });
  // select first job then send
  await page.locator("button", { hasText: /After-school|Weekend|Newborn|Summer/ }).first().click();
  await page.getByRole("button", { name: /Send Invitation/ }).click();
  await page.getByText("Invitation sent").waitFor({ timeout: 8000 });
  step(true, "parent: co-hire invitation sent");
  await page.screenshot({ path: `${SHOTS}/04-invite-sent.png` });
  await page.keyboard.press("Escape");

  // Post a job
  await page.goto(`${BASE}/dashboard/posts/new`, { waitUntil: "domcontentloaded" });
  const jobTitle = `E2E Test Job ${Date.now()}`;
  await page.getByPlaceholder("e.g. After-school Care · Mon–Thu").fill(jobTitle);
  await page.getByPlaceholder("e.g. Brooklyn, NY").fill("Brooklyn, NY");
  await page.getByRole("button", { name: "Post job" }).click();
  await page.waitForURL("**/dashboard/posts", { timeout: 10000 });
  await page.getByText(jobTitle).waitFor({ timeout: 8000 });
  step(true, "parent: posted a new job → appears in My Care Posts");
  await page.screenshot({ path: `${SHOTS}/05-job-posted.png` });

  // Chat
  await page.goto(`${BASE}/chat`, { waitUntil: "domcontentloaded" });
  await page.getByRole("heading", { name: "Messages" }).waitFor({ timeout: 8000 });
  const hasConvo = await page.getByText("Maya").first().isVisible().catch(() => false);
  step(hasConvo, "parent: Chat inbox shows the seeded Maya conversation");
  if (hasConvo) {
    await page.getByText("Maya").first().click();
    await page.getByPlaceholder("Write a message…").waitFor({ timeout: 6000 });
    const msg = `E2E hello ${Date.now()}`;
    await page.getByPlaceholder("Write a message…").fill(msg);
    await page.keyboard.press("Enter");
    await page.getByText(msg).first().waitFor({ timeout: 8000 });
    step(true, "parent: sent a chat message (appears in thread)");
    await page.screenshot({ path: `${SHOTS}/06-chat.png` });
  }
  await ctx.close();

  // ============ CAREGIVER (Maya) ============
  const ctx2 = await browser.newContext();
  const page2 = await ctx2.newPage();
  await signIn(page2, "mkt-demo-maya@raisingclub-test.dev");
  step(true, "caregiver: signed in");

  await page2.goto(`${BASE}/jobs`, { waitUntil: "domcontentloaded" });
  await page2.getByRole("heading", { name: "Find Jobs" }).waitFor({ timeout: 8000 });
  const jobCards = await page2.getByRole("button", { name: "Apply", exact: true }).count();
  step(jobCards >= 1, `caregiver: Find Jobs shows ${jobCards} apply-able jobs`);
  await page2.screenshot({ path: `${SHOTS}/07-find-jobs.png` });

  if (jobCards >= 1) {
    await page2.getByRole("button", { name: "Apply", exact: true }).first().click();
    await page2.getByRole("heading", { name: "Apply to this job" }).waitFor({ timeout: 6000 });
    await page2.getByPlaceholder(/Introduce yourself/).fill("I'd love to help — E2E test application.");
    await page2.getByRole("button", { name: "Send application" }).click();
    await page2.getByText("Application sent").waitFor({ timeout: 8000 });
    step(true, "caregiver: applied to a job");
    await page2.screenshot({ path: `${SHOTS}/08-applied.png` });
  }

  await page2.goto(`${BASE}/dashboard/applications`, { waitUntil: "domcontentloaded" });
  await page2.getByRole("heading", { name: "My Applications" }).waitFor({ timeout: 8000 });
  const hasInvite = await page2.getByText("Co-hire invitations").isVisible().catch(() => false);
  step(hasInvite, "caregiver: My Applications shows received co-hire invitation");
  await page2.screenshot({ path: `${SHOTS}/09-my-applications.png` });
  await ctx2.close();
} catch (e) {
  console.error("ERROR:", e.message);
  ok = false;
} finally {
  await browser.close();
  console.log(ok ? "\n✓ marketplace E2E PASSED" : "\n✗ E2E had failures (see above + screenshots)");
  process.exit(ok ? 0 : 1);
}
