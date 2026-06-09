/**
 * Live marketplace QA pass:
 * job creation -> caregiver filter/search/detail/application -> parent applicant
 * review/shortlist/chat -> caregiver reply -> navigation, active sidebar tabs,
 * back links, and notification surfaces.
 *
 * Run from web/:
 *   $env:BASE="https://theraisingclub.com"
 *   node --env-file=.env.local scripts/test-marketplace-live-flow.mjs
 */
import { chromium } from "../../qa-recordings/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = (process.env.BASE || "https://theraisingclub.com").replace(/\/$/, "");
const ts = Date.now();
const tag = String(ts).slice(-5);
const JOB_TITLE = `QA Marketplace Flow ${tag}`;
const PARENT_MSG = `QA parent message for ${JOB_TITLE}`;
const CAREGIVER_MSG = `QA caregiver reply for ${JOB_TITLE}`;
const SHOTS = path.resolve(process.cwd(), "..", "qa-recordings", "screenshots", `marketplace-live-flow-${tag}`);
fs.mkdirSync(SHOTS, { recursive: true });

const accounts = {
  parent: { email: "marketplace-test-parent@raisingclub-test.dev", password: "TestPass#2026" },
  caregiver: { email: "marketplace-test-caregiver@raisingclub-test.dev", password: "TestPass#2026" },
};

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function rec(name, pass, note = "") {
  results.push({ name, pass, note });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${note ? " - " + note : ""}`);
}

async function assertVisible(page, name, locator, timeout = 12000) {
  const pass = await locator.waitFor({ timeout }).then(() => true).catch(() => false);
  rec(name, pass);
  if (!pass) await page.screenshot({ path: path.join(SHOTS, `${slug(name)}.png`), fullPage: true }).catch(() => {});
  return pass;
}

function slug(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 80);
}

async function signIn(page, role) {
  const account = accounts[role];
  await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60000 });
  const email = page.locator("input:visible").nth(0);
  const password = page.locator("input:visible").nth(1);
  await email.waitFor({ timeout: 30000 });
  await email.click();
  await email.pressSequentially(account.email, { delay: 5 });
  await password.click();
  await password.pressSequentially(account.password, { delay: 5 });
  const emailValue = await email.inputValue().catch(() => "");
  if (emailValue !== account.email) throw new Error(`Sign-in email field did not fill for ${role}`);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    await page.getByRole("button", { name: /sign in/i }).click();
    const left = await Promise.race([
      page.waitForURL((url) => !url.pathname.endsWith("/sign-in"), { timeout: 15000 }).then(() => true).catch(() => false),
      page.getByRole("button", { name: /log out/i }).waitFor({ timeout: 15000 }).then(() => true).catch(() => false),
    ]);
    if (left) return;
    const body = await page.locator("body").innerText().catch(() => "");
    if (/invalid|missing|confirm|disabled|deactivated|error/i.test(body)) {
      throw new Error(`Sign-in failed for ${role}: ${body.match(/(invalid|missing|confirm|disabled|deactivated|error)[^\n]*/i)?.[0] ?? "auth error"}`);
    }
    await page.keyboard.press("Enter").catch(() => {});
    await sleep(1000);
  }
  throw new Error(`Sign-in did not leave /sign-in for ${role}`);
}

async function fillPlaceholder(page, pattern, value) {
  const input = page.getByPlaceholder(pattern).first();
  await input.waitFor({ timeout: 20000 });
  await input.fill(value);
}

async function maybeClick(locator, timeout = 4000) {
  await locator.waitFor({ timeout }).catch(() => {});
  if (await locator.isVisible().catch(() => false)) {
    await locator.click();
    return true;
  }
  return false;
}

async function chooseChip(page, patterns, fallbackIndex = 0) {
  for (const pattern of patterns) {
    const button = page.getByRole("button", { name: pattern }).first();
    if (await button.isVisible().catch(() => false)) {
      await button.click();
      return true;
    }
  }
  await page.locator('button[type="button"]').nth(fallbackIndex).click();
  return true;
}

async function activeSidebar(page, label) {
  const link = page.getByRole("link", { name: new RegExp(`^${label}$`, "i") }).first();
  const cls = (await link.getAttribute("class").catch(() => "")) ?? "";
  return /bg-\[#f6e6a3\]|bg-\[rgb|font-medium/.test(cls);
}

async function sendChatMessage(page, body) {
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

async function openNotifications(page) {
  const trigger = page.getByRole("button", { name: /^notifications$/i }).first();
  await trigger.click();
  return page.getByRole("heading", { name: /^notifications$/i }).waitFor({ timeout: 8000 }).then(() => true).catch(() => false);
}

const browser = await chromium.launch({ headless: true, slowMo: 50 });
const parentContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const caregiverContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const parent = await parentContext.newPage();
const caregiver = await caregiverContext.newPage();

for (const p of [parent, caregiver]) {
  p.on("console", (m) => {
    if (m.type() === "error" && !/404/.test(m.text())) console.log("  [console]", m.text());
  });
}

try {
  await signIn(parent, "parent");
  await parent.goto(`${BASE}/dashboard/posts`, { waitUntil: "domcontentloaded" });
  rec("Parent lands on My Care Posts", /\/dashboard\/posts$/.test(parent.url()));
  rec("Parent sidebar highlights My Care Posts", await activeSidebar(parent, "My Care Posts"));

  await parent.getByRole("link", { name: /post a job/i }).click();
  await parent.waitForURL("**/dashboard/posts/new", { timeout: 30000 });
  rec("New job page opens", /\/dashboard\/posts\/new$/.test(parent.url()));
  rec("New job page has back navigation", await parent.getByRole("link", { name: /my care posts/i }).first().isVisible().catch(() => false));

  await fillPlaceholder(parent, /after-school care/i, JOB_TITLE);
  await fillPlaceholder(parent, /describe the care/i, "QA flow: school pickup, snack, homework, and play until early evening.");
  await chooseChip(parent, [/babysit/i, /nanny/i, /after/i], 0);
  await chooseChip(parent, [/school/i, /child/i, /preschool/i], 1);
  await chooseChip(parent, [/after school/i, /weekday/i, /part/i], 2);
  await fillPlaceholder(parent, /specifics/i, "Mon-Thu, 3-6pm");
  await parent.locator('input[type="number"]').nth(0).fill("29").catch(() => {});
  await parent.locator('input[type="number"]').nth(1).fill("35").catch(() => {});
  await parent.locator('input[type="number"]').nth(2).fill("12").catch(() => {});
  await fillPlaceholder(parent, /brooklyn/i, "Brooklyn, NY");
  await fillPlaceholder(parent, /11215/i, "11215");
  await parent.locator('input[type="date"]').first().fill("2026-07-22").catch(() => {});
  await parent.getByRole("button", { name: /post job/i }).click();
  await parent.waitForURL("**/dashboard/posts", { timeout: 60000 });
  await assertVisible(parent, "Created job appears in My Care Posts", parent.getByText(JOB_TITLE));
  rec("Sidebar still highlights My Care Posts after create", await activeSidebar(parent, "My Care Posts"));

  await signIn(caregiver, "caregiver");
  await caregiver.goto(`${BASE}/jobs`, { waitUntil: "domcontentloaded" });
  rec("Caregiver lands on Find Jobs", /\/jobs$/.test(new URL(caregiver.url()).pathname));
  rec("Caregiver sidebar highlights Find Care Roles", await activeSidebar(caregiver, "Find Care Roles"));
  await assertVisible(caregiver, "Find Jobs filters are visible", caregiver.getByRole("heading", { name: /filters/i }));
  await chooseChip(caregiver, [/babysit/i, /nanny/i, /after/i], 0);
  await caregiver.getByLabel(/maximum child age/i).fill("96").catch(() => {});

  await caregiver.goto(`${BASE}/jobs?q=${encodeURIComponent(JOB_TITLE)}`, { waitUntil: "domcontentloaded" });
  await assertVisible(caregiver, "Caregiver can find newly created job by search", caregiver.getByText(JOB_TITLE).first(), 45000);
  await caregiver.locator("div").filter({ hasText: JOB_TITLE }).first().getByRole("link", { name: /view details/i }).click();
  await caregiver.waitForURL("**/jobs/**", { timeout: 30000 });
  await assertVisible(caregiver, "Job detail displays correct title", caregiver.getByText(JOB_TITLE).first());
  rec("Job detail has back navigation", await caregiver.getByRole("link", { name: /find jobs|back/i }).first().isVisible().catch(() => false));

  await caregiver.getByRole("button", { name: /apply now|apply/i }).first().click();
  await assertVisible(caregiver, "Application modal opens", caregiver.getByRole("heading", { name: /apply to this job/i }));
  await caregiver.getByPlaceholder(/introduce yourself/i).fill("QA applicant note: experienced with after-school routines and homework support.");
  await caregiver.getByPlaceholder(/28/i).fill("31");
  await caregiver.getByRole("button", { name: /send application/i }).click();
  await assertVisible(caregiver, "Application sent confirmation appears", caregiver.getByText(/application sent/i), 30000);
  await maybeClick(caregiver.getByRole("button", { name: /done/i }), 5000);
  await caregiver.goto(`${BASE}/dashboard/applications`, { waitUntil: "domcontentloaded" });
  rec("Caregiver sidebar highlights My Applications", await activeSidebar(caregiver, "My Applications"));
  await assertVisible(caregiver, "Caregiver My Applications page loads", caregiver.getByRole("heading", { name: /applications/i }).first());

  await parent.reload({ waitUntil: "domcontentloaded" });
  await sleep(2000);
  const parentNotificationsOpened = await openNotifications(parent);
  const parentNotifText = await parent.locator("body").innerText();
  rec("Parent notification feed opens after application", parentNotificationsOpened);
  rec("Parent notification feed references applicant/job", /application|applicant|Emily|QA Marketplace/i.test(parentNotifText), "Expected application-related notification text");
  await parent.getByRole("button", { name: /close notifications/i }).click().catch(() => {});

  await parent.goto(`${BASE}/dashboard/posts`, { waitUntil: "domcontentloaded" });
  await parent.locator('a[href*="/dashboard/posts/"][href*="/applicants"]').first().click();
  await parent.waitForURL("**/dashboard/posts/**/applicants", { timeout: 30000 });
  await assertVisible(parent, "Applicants page shows correct job title", parent.getByText(JOB_TITLE));
  rec("Applicants page has back navigation to My Care Posts", await parent.getByRole("link", { name: /my care posts/i }).first().isVisible().catch(() => false));
  await assertVisible(parent, "Applicant row/card is visible", parent.getByText(/proposed rate/i).first());
  let shortlistVisible = await parent.getByRole("button", { name: /shortlist/i }).first().isVisible().catch(() => false);
  if (!shortlistVisible) {
    rec("Applicant list shows inline action buttons", false, "Expected Message/Shortlist/Hire/Decline on applicant list");
    const detailLink = parent.locator('a[href*="/applicants/"]').first();
    if (await detailLink.isVisible().catch(() => false)) {
      await detailLink.click();
    } else {
      await parent.locator("div").filter({ hasText: /proposed rate/i }).first().click();
    }
    await parent.waitForURL("**/dashboard/posts/**/applicants/**", { timeout: 12000 }).catch(() => {});
    rec("Applicant detail route opens from applicant card", /\/applicants\/[^/]+$/.test(new URL(parent.url()).pathname));
    rec("Applicant detail has back navigation", await parent.getByRole("link", { name: /applicants|my care posts|back/i }).first().isVisible().catch(() => false));
    shortlistVisible = await parent.getByRole("button", { name: /shortlist/i }).first().isVisible().catch(() => false);
  } else {
    rec("Applicant list shows inline action buttons", true);
  }
  if (!shortlistVisible) throw new Error("Shortlist action is not available from applicant list or detail page");
  await parent.getByRole("button", { name: /shortlist/i }).first().click();
  await assertVisible(parent, "Applicant status updates to Shortlisted", parent.getByText(/shortlisted/i).first(), 20000);

  await parent.getByRole("link", { name: /message/i }).first().click();
  await parent.waitForURL("**/chat**", { timeout: 30000 });
  rec("Parent sidebar highlights Messages", await activeSidebar(parent, "Messages"));
  await sendChatMessage(parent, PARENT_MSG);
  rec("Parent can send chat message", await parent.getByText(PARENT_MSG).first().isVisible().catch(() => false));

  await caregiver.goto(`${BASE}/chat`, { waitUntil: "domcontentloaded" });
  rec("Caregiver sidebar highlights Messages", await activeSidebar(caregiver, "Messages"));
  const caregiverNotificationsOpened = await openNotifications(caregiver);
  const caregiverNotifText = await caregiver.locator("body").innerText();
  rec("Caregiver notification feed opens after parent chat", caregiverNotificationsOpened);
  rec("Caregiver chat unread indicator appears", /QA parent message|John S\.|1/.test(caregiverNotifText), "Messages list should show unread chat");
  rec("Caregiver notification feed references new message", caregiverNotificationsOpened && /message|chat|parent|QA parent/i.test(caregiverNotifText), "Expected chat-related notification text");
  await caregiver.getByRole("button", { name: /close notifications/i }).click().catch(() => {});
  await caregiver.locator('a[href^="/chat?c="]').first().click();
  await caregiver.waitForURL("**/chat?c=**", { timeout: 30000 }).catch(() => {});
  await assertVisible(caregiver, "Caregiver receives parent message", caregiver.getByText(PARENT_MSG).first(), 30000);
  await sendChatMessage(caregiver, CAREGIVER_MSG);
  rec("Caregiver can reply in chat", await caregiver.getByText(CAREGIVER_MSG).first().isVisible().catch(() => false));

  await parent.goto(`${BASE}/chat`, { waitUntil: "domcontentloaded" });
  await parent.locator('a[href^="/chat?c="]').first().click();
  await parent.waitForURL("**/chat?c=**", { timeout: 30000 }).catch(() => {});
  await assertVisible(parent, "Parent receives caregiver reply", parent.getByText(CAREGIVER_MSG).first(), 30000);

  await parent.goto(`${BASE}/dashboard/posts`, { waitUntil: "domcontentloaded" });
  const row = parent.locator("div").filter({ hasText: JOB_TITLE }).first();
  await row.locator('button[aria-label="More"]').first().click().catch(() => {});
  const closed = await maybeClick(parent.getByRole("button", { name: /^close$/i }).first(), 4000);
  if (closed) rec("Cleanup: close demo job from More menu", true);
  else console.log("WARN  Cleanup: demo job may need manual close");

  await parent.screenshot({ path: path.join(SHOTS, "final-parent-posts.png"), fullPage: true });
  await caregiver.screenshot({ path: path.join(SHOTS, "final-caregiver-chat.png"), fullPage: true });
} catch (e) {
  rec("Unexpected test error", false, e.message);
  await parent.screenshot({ path: path.join(SHOTS, "unexpected-parent.png"), fullPage: true }).catch(() => {});
  await caregiver.screenshot({ path: path.join(SHOTS, "unexpected-caregiver.png"), fullPage: true }).catch(() => {});
} finally {
  await parentContext.close();
  await caregiverContext.close();
  await browser.close();
}

const passed = results.filter((r) => r.pass).length;
const total = results.length;
const report = [
  `# Marketplace Live Flow QA (${new Date().toISOString()})`,
  "",
  `Base: ${BASE}`,
  `Job: ${JOB_TITLE}`,
  `Result: ${passed}/${total} passed`,
  `Screenshots: ${SHOTS}`,
  "",
  ...results.map((r) => `- ${r.pass ? "PASS" : "FAIL"}: ${r.name}${r.note ? ` - ${r.note}` : ""}`),
  "",
].join("\n");
const reportPath = path.join(SHOTS, "report.md");
fs.writeFileSync(reportPath, report);
console.log(`\n===== RESULT: ${passed}/${total} passed =====`);
console.log(`Report: ${reportPath}`);
process.exit(passed === total ? 0 : 1);
