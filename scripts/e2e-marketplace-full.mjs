// Full-coverage marketplace E2E in a real browser (Playwright/Node), driving the
// installed chromium-1217. Server on :3200. Covers: job creation -> application ->
// applicant review/shortlist -> parent<->applicant chat (both ways, one deduped
// thread) -> parent<->parent chat (both ways) -> co-hire invite. Self-cleans.
//   node --env-file=.env.local scripts/e2e-marketplace-full.mjs
import { chromium } from "playwright";
import pg from "pg";
import os from "node:os";
import path from "node:path";
import fs from "node:fs";

const EXE = path.join(os.homedir(), "AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe");
const BASE = "http://localhost:3200";
const PW = "TestPass#2026";
const SHOTS = "D:/Projects/The Raising Club/Reference-docs/Marketplace/screenshots/test";
fs.mkdirSync(SHOTS, { recursive: true });
const tag = Date.now();
const JOB_TITLE = `Round Test Job ${tag}`;

const results = [];
const rec = (name, pass, note = "") => {
  results.push({ name, pass, note });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${note ? " - " + note : ""}`);
};

const db = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();
const idByEmail = async (e) => (await db.query("select id from auth.users where email=$1", [e])).rows[0]?.id;

const browser = await chromium.launch({ executablePath: EXE, headless: true });
async function newCtx() { const c = await browser.newContext(); return { c, p: await c.newPage() }; }
async function signIn(p, email) {
  await p.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
  await p.getByRole("textbox", { name: "Email" }).fill(email);
  await p.getByRole("textbox", { name: "Password" }).fill(PW);
  await p.getByRole("button", { name: "Sign in" }).click();
  await p.waitForURL("**/dashboard", { timeout: 20000 });
}
async function sendChat(p, text) {
  await p.getByPlaceholder("Write a message…").waitFor({ timeout: 8000 });
  await p.getByPlaceholder("Write a message…").fill(text);
  await p.keyboard.press("Enter");
  await p.getByText(text).first().waitFor({ timeout: 8000 });
}

let jobId;
try {
  const PARENT = "mkt-demo-parent@raisingclub-test.dev";
  const CG = "mkt-demo-maya@raisingclub-test.dev";
  const FAM = "mkt-fam-alvarez@raisingclub-test.dev";
  const parentId = await idByEmail(PARENT);

  // CASE 1: parent creates a job
  const { c: pc, p: parent } = await newCtx();
  await signIn(parent, PARENT);
  await parent.goto(`${BASE}/dashboard/posts/new`, { waitUntil: "domcontentloaded" });
  await parent.getByPlaceholder("e.g. After-school Care · Mon–Thu").fill(JOB_TITLE);
  await parent.getByPlaceholder("e.g. Brooklyn, NY").fill("Brooklyn, NY");
  await parent.getByPlaceholder("Specifics, e.g. Mon–Thu, 3–6pm").fill("Mon–Thu, 3–6pm");
  await parent.getByRole("button", { name: "Post job" }).click();
  await parent.waitForURL("**/dashboard/posts", { timeout: 12000 });
  rec("CASE 1  parent creates job (Active in My Care Posts)", await parent.getByText(JOB_TITLE).isVisible().catch(() => false));
  jobId = (await db.query("select id from job_posts where owner_user_id=$1 and title=$2", [parentId, JOB_TITLE])).rows[0]?.id;
  rec("CASE 1b job persisted with owner", !!jobId);

  // CASE 2: caregiver finds + applies
  const { c: cc, p: cg } = await newCtx();
  await signIn(cg, CG);
  await cg.goto(`${BASE}/jobs?q=Round%20Test%20Job%20${tag}`, { waitUntil: "domcontentloaded" });
  const jobCard = cg.locator('[class*="bg-mint"]').filter({ hasText: JOB_TITLE }).first();
  await jobCard.waitFor({ timeout: 8000 });
  rec("CASE 2  caregiver finds the job in Find Jobs", true);
  await jobCard.getByRole("button", { name: "Apply", exact: true }).click();
  await cg.getByRole("heading", { name: "Apply to this job" }).waitFor({ timeout: 6000 });
  await cg.getByPlaceholder(/Introduce yourself/).fill(`Applying - round test ${tag}`);
  await cg.getByRole("button", { name: "Send application" }).click();
  await cg.getByText("Application sent").waitFor({ timeout: 8000 });
  rec("CASE 2b caregiver applies", true);

  // CASE 3: parent sees applicant
  await parent.goto(`${BASE}/dashboard/posts/${jobId}/applicants`, { waitUntil: "domcontentloaded" });
  rec("CASE 3  parent sees applicant on the job", await parent.getByText("Maya").first().isVisible().catch(() => false));
  await parent.screenshot({ path: `${SHOTS}/full-03-applicants.png` });

  // CASE 4: parent shortlists
  await parent.getByRole("button", { name: "Shortlist" }).first().click();
  rec("CASE 4  parent shortlists applicant", await parent.getByText("Shortlisted").first().waitFor({ timeout: 6000 }).then(() => true).catch(() => false));

  // CASE 5: parent messages applicant
  await parent.getByRole("link", { name: "Message", exact: true }).first().click();
  await parent.waitForURL("**/chat**", { timeout: 10000 });
  await sendChat(parent, `P2C ${tag}`);
  rec("CASE 5  parent -> applicant chat (sent)", true);
  await parent.screenshot({ path: `${SHOTS}/full-05-parent-to-applicant.png` });

  // CASE 6: caregiver messages family from the job (same thread) + replies
  await cg.goto(`${BASE}/jobs/${jobId}`, { waitUntil: "domcontentloaded" });
  await cg.getByRole("link", { name: "Message family" }).click();
  await cg.waitForURL("**/chat**", { timeout: 10000 });
  rec("CASE 6  caregiver opens SAME thread (sees parent msg)", await cg.getByText(`P2C ${tag}`).first().isVisible().catch(() => false));
  await sendChat(cg, `C2P ${tag}`);
  rec("CASE 6b caregiver -> parent reply (sent)", true);

  await parent.goto(`${BASE}/chat`, { waitUntil: "domcontentloaded" });
  await parent.getByText("Maya").first().click();
  rec("CASE 6c parent receives caregiver reply (two-way)", await parent.getByText(`C2P ${tag}`).first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false));
  await parent.screenshot({ path: `${SHOTS}/full-06-two-way-thread.png` });

  // CASE 7: parent <-> parent chat
  await parent.goto(`${BASE}/connect/families`, { waitUntil: "domcontentloaded" });
  const famCard = parent.locator('[class*="bg-sage"]').filter({ hasText: "The Alvarez" }).first();
  await famCard.waitFor({ timeout: 8000 });
  await famCard.getByRole("link", { name: "Message", exact: true }).click();
  await parent.waitForURL("**/chat**", { timeout: 10000 });
  await sendChat(parent, `P2P ${tag}`);
  rec("CASE 7  parent -> parent chat (sent)", true);

  const { c: fc, p: fam } = await newCtx();
  await signIn(fam, FAM);
  await fam.goto(`${BASE}/chat`, { waitUntil: "domcontentloaded" });
  const famConvo = await fam.getByText(/Pat/).first().isVisible().catch(() => false);
  rec("CASE 7b other parent sees the conversation", famConvo);
  if (famConvo) {
    await fam.getByText(/Pat/).first().click();
    rec("CASE 7c other parent receives the message", await fam.getByText(`P2P ${tag}`).first().waitFor({ timeout: 8000 }).then(() => true).catch(() => false));
    await sendChat(fam, `P2P-reply ${tag}`);
    rec("CASE 7d other parent replies (sent)", true);
  }
  await fam.screenshot({ path: `${SHOTS}/full-07-parent-to-parent.png` });

  // CASE 8: co-hire invite -> caregiver My Applications
  await parent.goto(`${BASE}/connect`, { waitUntil: "domcontentloaded" });
  const mayaCard = parent.locator('[class*="bg-mint"]').filter({ hasText: "Maya H." }).first();
  await mayaCard.getByRole("button", { name: "Invite", exact: true }).click();
  await parent.getByRole("heading", { name: "Invite to Co-Hire" }).waitFor({ timeout: 6000 });
  await parent.locator("button", { hasText: JOB_TITLE }).first().click();
  await parent.getByRole("button", { name: /Send Invitation/ }).click();
  await parent.getByText("Invitation sent").waitFor({ timeout: 8000 });
  rec("CASE 8  parent sends co-hire invite for the job", true);
  await cg.goto(`${BASE}/dashboard/applications`, { waitUntil: "domcontentloaded" });
  rec("CASE 8b caregiver sees invite in My Applications", await cg.getByText("Co-hire invitations").isVisible().catch(() => false));
  await cg.screenshot({ path: `${SHOTS}/full-08-my-applications.png` });

  await pc.close(); await cc.close(); await fc.close();
} catch (e) {
  rec("UNEXPECTED ERROR", false, e.message);
} finally {
  await browser.close();
  try {
    if (jobId) await db.query("delete from job_posts where id=$1", [jobId]);
    await db.query("delete from messages where body like $1", [`%${tag}%`]);
  } catch (e) { console.error("cleanup warn:", e.message); }
  await db.end();
  const passed = results.filter((r) => r.pass).length;
  console.log(`\n===== ANALYSIS: ${passed}/${results.length} passed =====`);
  process.exit(passed === results.length ? 0 : 1);
}
