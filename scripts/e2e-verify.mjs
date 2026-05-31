// Verification suite for the 4 asks: back buttons, filters, owner-only job
// edit/deactivate, and the "already applied" indicator in the co-hire modal.
// Real browser (Playwright/Node) against :3200. Self-cleans.
//   node --env-file=.env.local scripts/e2e-verify.mjs
import { chromium } from "playwright";
import pg from "pg";
import os from "node:os"; import path from "node:path"; import fs from "node:fs";

const EXE = path.join(os.homedir(), "AppData/Local/ms-playwright/chromium-1217/chrome-win64/chrome.exe");
const BASE = (process.env.E2E_BASE || "http://localhost:3200").replace(/\/$/, "");
const PW = "TestPass#2026";
const SHOTS = "D:/Projects/The Raising Club/Reference-docs/Marketplace/screenshots/test";
fs.mkdirSync(SHOTS, { recursive: true });
const tag = Date.now();
const JOB_TITLE = `Verify Job ${tag}`;

const results = [];
const rec = (n, p, note = "") => { results.push({ n, p }); console.log(`${p ? "PASS" : "FAIL"}  ${n}${note ? " - " + note : ""}`); };

const db = new pg.Client({ host: "db.xocomzqhlciukgodjptr.supabase.co", port: 5432, user: "postgres", password: process.env.SUPABASE_DB_PASSWORD, database: "postgres", ssl: { rejectUnauthorized: false } });
await db.connect();
const idByEmail = async (e) => (await db.query("select id from auth.users where email=$1", [e])).rows[0]?.id;

const browser = await chromium.launch({ executablePath: EXE, headless: true });
async function ctxFor(email) {
  const p = await (await browser.newContext({ viewport: { width: 1366, height: 900 } })).newPage();
  // Retry to tolerate Supabase auth rate-limiting across repeated test runs.
  for (let attempt = 1; attempt <= 4; attempt++) {
    await p.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
    await p.getByRole("textbox", { name: "Email" }).fill(email);
    await p.getByRole("textbox", { name: "Password" }).fill(PW);
    await p.getByRole("button", { name: "Sign in" }).click();
    try {
      await p.waitForURL("**/dashboard", { timeout: 12000 });
      return p;
    } catch {
      if (attempt === 4) throw new Error(`sign-in failed for ${email} after retries`);
      await p.waitForTimeout(8000 * attempt);
    }
  }
  return p;
}
const vis = (loc) => loc.first().isVisible().catch(() => false);

let jobId;
try {
  const parent = await ctxFor("mkt-demo-parent@raisingclub-test.dev");
  const parentId = await idByEmail("mkt-demo-parent@raisingclub-test.dev");

  // ============ 1) BACK BUTTONS ============
  // create a job first (also used by parts 3 & 4)
  await parent.goto(`${BASE}/dashboard/posts/new`, { waitUntil: "domcontentloaded" });
  rec("BACK · /dashboard/posts/new has 'My Care Posts' back link", await vis(parent.getByRole("link", { name: "My Care Posts" })));
  await parent.getByPlaceholder("e.g. After-school Care · Mon–Thu").fill(JOB_TITLE);
  await parent.getByPlaceholder("e.g. Brooklyn, NY").fill("Brooklyn, NY");
  await parent.getByRole("button", { name: "Post job" }).click();
  await parent.waitForURL("**/dashboard/posts", { timeout: 20000 });
  jobId = (await db.query("select id from job_posts where owner_user_id=$1 and title=$2", [parentId, JOB_TITLE])).rows[0]?.id;

  await parent.goto(`${BASE}/dashboard/posts/${jobId}/edit`, { waitUntil: "domcontentloaded" });
  rec("BACK · /edit has 'My Care Posts' back link", await vis(parent.getByRole("link", { name: "My Care Posts" })));
  await parent.goto(`${BASE}/dashboard/posts/${jobId}/applicants`, { waitUntil: "domcontentloaded" });
  rec("BACK · /applicants has 'My Care Posts' back link", await vis(parent.getByRole("link", { name: "My Care Posts" })));
  await parent.goto(`${BASE}/jobs/${jobId}`, { waitUntil: "domcontentloaded" });
  rec("BACK · /jobs/[id] has 'Find Jobs' back link", await vis(parent.getByRole("link", { name: "Find Jobs" })));
  await parent.goto(`${BASE}/dashboard/family-listing`, { waitUntil: "domcontentloaded" });
  rec("BACK · /family-listing has 'Connect Families' back link", await vis(parent.getByRole("link", { name: "Connect Families" })));
  // back link actually navigates
  await parent.getByRole("link", { name: "Connect Families" }).first().click();
  await parent.waitForURL("**/connect/families", { timeout: 15000 });
  rec("BACK · clicking back navigates to the target", parent.url().includes("/connect/families"));

  // ============ 2) FILTERS ============
  // Care Type chip + Apply (UI path): Aiko = group_center -> schools_centers
  await parent.goto(`${BASE}/connect`, { waitUntil: "domcontentloaded" });
  const baseCount = await parent.getByRole("button", { name: "View Profile" }).count();
  await parent.getByRole("button", { name: "Schools & Centers" }).click();
  await parent.getByRole("button", { name: "Apply Filters" }).click();
  await parent.waitForURL("**/connect?*care=schools_centers*", { timeout: 15000 });
  const afterCount = await parent.getByRole("button", { name: "View Profile" }).count();
  rec("FILTER · Care Type chip narrows results", afterCount > 0 && afterCount <= baseCount && (await vis(parent.getByText("Aiko T."))) && !(await vis(parent.getByText("Maya H."))));
  await parent.screenshot({ path: `${SHOTS}/verify-filter-caretype.png` });

  // Search q (URL): Montessori -> only Aiko
  await parent.goto(`${BASE}/connect?q=Montessori`, { waitUntil: "domcontentloaded" });
  rec("FILTER · search q matches headline (Montessori -> Aiko only)", (await vis(parent.getByText("Aiko T."))) && !(await vis(parent.getByText("Camille D."))));

  // Where (URL): Austin -> only Camille
  await parent.goto(`${BASE}/connect?where=Austin`, { waitUntil: "domcontentloaded" });
  rec("FILTER · where matches location (Austin -> Camille only)", (await vis(parent.getByText("Camille D."))) && !(await vis(parent.getByText("Maya H."))));

  // Jobs search filter
  await parent.goto(`${BASE}/jobs?q=Verify%20Job%20${tag}`, { waitUntil: "domcontentloaded" });
  rec("FILTER · /jobs search finds the new job", await vis(parent.getByText(JOB_TITLE)));

  // Families filter (age) sanity: page loads with filter param
  await parent.goto(`${BASE}/connect/families?care=home_family`, { waitUntil: "domcontentloaded" });
  rec("FILTER · /connect/families accepts filter params", await vis(parent.getByRole("heading", { name: "Connect Families" })));

  // ============ 4) CO-HIRE 'ALREADY APPLIED' (do before deactivating job) ============
  const cg = await ctxFor("mkt-demo-maya@raisingclub-test.dev");
  await cg.goto(`${BASE}/jobs/${jobId}`, { waitUntil: "domcontentloaded" });
  await cg.getByRole("button", { name: "Apply now" }).click();
  await cg.getByRole("heading", { name: "Apply to this job" }).waitFor({ timeout: 15000 });
  await cg.getByRole("button", { name: "Send application" }).click();
  await cg.getByText("Application sent").waitFor({ timeout: 15000 });
  rec("CO-HIRE · caregiver applied to the job", true);

  await parent.goto(`${BASE}/connect`, { waitUntil: "domcontentloaded" });
  const mayaCard = parent.locator('[class*="bg-mint"]').filter({ hasText: "Maya H." }).first();
  await mayaCard.getByRole("button", { name: "Invite", exact: true }).click();
  await parent.getByRole("heading", { name: "Invite to Co-Hire" }).waitFor({ timeout: 15000 });
  await parent.waitForTimeout(1500); // let applied-status load
  rec("CO-HIRE · modal shows 'already applied' summary", await vis(parent.getByText(/already applied to/)));
  rec("CO-HIRE · modal shows 'Applied' badge on the job", await vis(parent.getByText("Applied", { exact: true })));
  await parent.screenshot({ path: `${SHOTS}/verify-cohire-applied.png` });
  await parent.keyboard.press("Escape");

  // ============ 3) OWNER-ONLY EDIT / DEACTIVATE ============
  // owner edits the job
  await parent.goto(`${BASE}/dashboard/posts/${jobId}/edit`, { waitUntil: "domcontentloaded" });
  rec("EDIT · owner can open the edit form", await vis(parent.getByRole("heading", { name: "Edit job" })));
  const newTitle = `${JOB_TITLE} (edited)`;
  await parent.getByPlaceholder("e.g. After-school Care · Mon–Thu").fill(newTitle);
  await parent.getByRole("button", { name: /Save changes|Post job/ }).click();
  await parent.waitForURL("**/dashboard/posts", { timeout: 20000 });
  rec("EDIT · owner edit persists", await vis(parent.getByText(newTitle)));

  // owner deactivates (Move to draft) via the row menu (newest row = first)
  await parent.getByRole("button", { name: "More" }).first().click();
  await parent.getByText("Move to draft").click();
  await parent.waitForTimeout(1500);
  const draftBadge = await parent.locator('div').filter({ hasText: newTitle }).getByText("Draft").first().isVisible().catch(() => false);
  rec("DEACTIVATE · owner can move job to Draft", draftBadge);
  // republish so the next check (non-owner) reads an open job
  await parent.getByRole("button", { name: "More" }).first().click();
  await parent.getByText(/Publish/).click();
  await parent.waitForTimeout(1500);

  // non-owner (a different parent) CANNOT open the edit form
  const other = await ctxFor("mkt-fam-alvarez@raisingclub-test.dev");
  await other.goto(`${BASE}/dashboard/posts/${jobId}/edit`, { waitUntil: "domcontentloaded" });
  await other.waitForTimeout(1200);
  const otherSeesForm = await other.getByRole("heading", { name: "Edit job" }).isVisible().catch(() => false);
  rec("EDIT · non-owner is BLOCKED from the edit form", !otherSeesForm);
  // non-owner doesn't see the job in their My Care Posts
  await other.goto(`${BASE}/dashboard/posts`, { waitUntil: "domcontentloaded" });
  rec("EDIT · non-owner doesn't see the job in My Care Posts", !(await other.getByText(JOB_TITLE).first().isVisible().catch(() => false)));
} catch (e) {
  rec("UNEXPECTED ERROR", false, e.message);
} finally {
  await browser.close();
  try { if (jobId) await db.query("delete from job_posts where id=$1", [jobId]); } catch {}
  await db.end();
  const passed = results.filter((r) => r.p).length;
  console.log(`\n===== VERIFY ANALYSIS: ${passed}/${results.length} passed =====`);
  process.exit(passed === results.length ? 0 : 1);
}
