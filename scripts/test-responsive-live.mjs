/**
 * Responsive QA sweep for the live site.
 *
 * Checks mobile and tablet viewports for:
 * - route loads
 * - horizontal overflow
 * - obvious broken/error text
 * - missing main/headline content
 *
 * Saves screenshots for every failing route and writes a markdown report.
 *
 * Run from web/:
 *   $env:BASE="https://theraisingclub.com"
 *   $env:QA_PASSWORD="RaisingQA!2026"
 *   node --env-file=.env.local scripts/test-responsive-live.mjs
 */
import { chromium } from "../../qa-recordings/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = (process.env.BASE || "https://theraisingclub.com").replace(/\/$/, "");
const QA_PASSWORD = process.env.QA_PASSWORD || "RaisingQA!2026";
const ts = Date.now();
const tag = String(ts).slice(-5);
const OUT = path.resolve(process.cwd(), "..", "qa-recordings", "screenshots", `responsive-live-${tag}`);
fs.mkdirSync(OUT, { recursive: true });

const viewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "tablet", width: 768, height: 1024 },
];

const accounts = {
  parent: { email: "qa-parent@raisingclub-test.dev", password: QA_PASSWORD },
  caregiver: { email: "qa-caregiver@raisingclub-test.dev", password: QA_PASSWORD },
  org: { email: "qa-org@raisingclub-test.dev", password: QA_PASSWORD },
  admin: { email: "qa-admin@raisingclub-test.dev", password: QA_PASSWORD },
};

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 110);

function rec(item) {
  results.push(item);
  const prefix = item.pass ? "PASS" : "FAIL";
  console.log(`${prefix}  [${item.viewport}] ${item.label} ${item.path}${item.issue ? " - " + item.issue : ""}`);
}

async function signIn(page, role) {
  const account = accounts[role];
  await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded", timeout: 60000 });
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const email = page.locator("input:visible").nth(0);
    const password = page.locator("input:visible").nth(1);
    await email.waitFor({ timeout: 30000 });
    await email.click();
    await email.fill("");
    await email.pressSequentially(account.email, { delay: 3 });
    await password.click();
    await password.fill("");
    await password.pressSequentially(account.password, { delay: 3 });
    await page.getByRole("button", { name: /sign in/i }).click();
    const left = await Promise.race([
      page.waitForURL((url) => !url.pathname.endsWith("/sign-in"), { timeout: 18000 }).then(() => true).catch(() => false),
      page.getByRole("button", { name: /log out/i }).waitFor({ timeout: 18000 }).then(() => true).catch(() => false),
    ]);
    if (left) return;
    const body = await page.locator("body").innerText().catch(() => "");
    if (/invalid|missing|confirm|disabled|deactivated/i.test(body)) {
      await page.screenshot({ path: path.join(OUT, `signin-${role}-${attempt}.png`), fullPage: true }).catch(() => {});
    }
    await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  }
  throw new Error(`Could not sign in as ${role}`);
}

async function firstDetailHref(page, prefix, exclude = []) {
  const links = page.locator(`a[href*="${prefix}"]`);
  const count = await links.count();
  for (let i = 0; i < count; i += 1) {
    const href = await links.nth(i).getAttribute("href");
    if (!href) continue;
    const normalizedHref = href.startsWith("http") ? new URL(href).pathname : href;
    if (exclude.some((x) => href.includes(x))) continue;
    const clean = normalizedHref.split("?")[0].replace(/\/$/, "");
    if (clean !== prefix.replace(/\/$/, "") && clean.split("/").length >= prefix.split("/").length + 1) {
      return normalizedHref;
    }
  }
  return null;
}

async function collectDynamicRoutes() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const routes = [];

  try {
    await signIn(page, "parent");

    await page.goto(`${BASE}/courses`, { waitUntil: "domcontentloaded" });
    const courseHref = await firstDetailHref(page, "/courses/", ["/my", "/quiz", "/certificate"]);
    if (courseHref) routes.push({ label: "Course detail", path: courseHref, role: "parent" });

    await page.goto(`${BASE}/events`, { waitUntil: "domcontentloaded" });
    const eventHref = await firstDetailHref(page, "/events/", ["/my", "/register"]);
    if (eventHref) routes.push({ label: "Event detail", path: eventHref, role: "parent" });

    await page.goto(`${BASE}/connect`, { waitUntil: "domcontentloaded" });
    const profileHref = await firstDetailHref(page, "/profile/", []);
    if (profileHref) routes.push({ label: "Public caregiver profile", path: profileHref, role: "parent" });

    await page.goto(`${BASE}/dashboard/posts`, { waitUntil: "domcontentloaded" });
    const applicantsHref = await firstDetailHref(page, "/dashboard/posts/", ["/edit"]);
    if (applicantsHref) routes.push({ label: "Parent applicants dynamic", path: applicantsHref, role: "parent" });
  } catch (e) {
    console.log("WARN dynamic parent route collection:", e.message);
  }

  try {
    await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
    await signIn(page, "caregiver");
    await page.goto(`${BASE}/jobs`, { waitUntil: "domcontentloaded" });
    const jobHref = await firstDetailHref(page, "/jobs/", []);
    if (jobHref) routes.push({ label: "Job detail", path: jobHref, role: "caregiver" });
  } catch (e) {
    console.log("WARN dynamic caregiver route collection:", e.message);
  }

  await browser.close();
  return routes;
}

async function checkPage(page, viewportName, route) {
  const url = route.path.startsWith("http") ? route.path : `${BASE}${route.path}`;
  const resultBase = { viewport: viewportName, label: route.label, path: route.path, role: route.role ?? "public" };
  let issue = "";
  let screenshot = "";

  try {
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(1100);

    const metrics = await page.evaluate(() => {
      const doc = document.documentElement;
      const body = document.body;
      const vw = window.innerWidth;
      const horizontalOverflow = Math.max(doc.scrollWidth, body.scrollWidth) - vw;
      const mainText = (document.querySelector("main")?.innerText || body.innerText || "").slice(0, 5000);
      const headings = [...document.querySelectorAll("h1,h2")].map((h) => h.textContent?.trim()).filter(Boolean);
      const fixedCandidates = [...document.querySelectorAll("body *")].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > vw + 2 && r.height > 8;
      }).slice(0, 8).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName,
          text: (el.textContent || "").trim().slice(0, 90),
          width: Math.round(r.width),
          className: String(el.getAttribute("class") || "").slice(0, 120),
        };
      });
      return { horizontalOverflow, mainText, headings, fixedCandidates };
    });

    const bodyText = metrics.mainText;
    if (metrics.horizontalOverflow > 6) {
      issue = `Horizontal overflow ${Math.round(metrics.horizontalOverflow)}px`;
    } else if (/Application error|Internal Server Error|Something went wrong|not found/i.test(bodyText)) {
      issue = "Page shows error text";
    } else if (!metrics.headings.length && bodyText.trim().length < 40) {
      issue = "Page appears visually empty or missing headings";
    }

    if (issue) {
      screenshot = path.join(OUT, `${viewportName}-${slug(route.label + "-" + route.path)}.png`);
      await page.screenshot({ path: screenshot, fullPage: true });
      rec({ ...resultBase, pass: false, issue, screenshot, details: metrics.fixedCandidates });
    } else {
      rec({ ...resultBase, pass: true });
    }
  } catch (e) {
    issue = e.message;
    screenshot = path.join(OUT, `${viewportName}-${slug(route.label + "-" + route.path)}-error.png`);
    await page.screenshot({ path: screenshot, fullPage: true }).catch(() => {});
    rec({ ...resultBase, pass: false, issue, screenshot });
  }
}

function reportMarkdown() {
  const fails = results.filter((r) => !r.pass);
  const passes = results.filter((r) => r.pass);
  const rel = (p) => p ? path.relative(OUT, p).replaceAll("\\", "/") : "";
  const lines = [];
  lines.push("# Responsive QA Report");
  lines.push("");
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push(`Environment: ${BASE}`);
  lines.push(`Viewports: ${viewports.map((v) => `${v.name} ${v.width}x${v.height}`).join(", ")}`);
  lines.push(`Result: ${passes.length}/${results.length} checks passed`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Passed: ${passes.length}`);
  lines.push(`- Failed: ${fails.length}`);
  lines.push(`- Screenshot folder: \`${OUT}\``);
  lines.push("");
  lines.push("## Issues");
  lines.push("");
  if (!fails.length) {
    lines.push("No responsive issues were detected by this automated sweep.");
  } else {
    for (const f of fails) {
      lines.push(`### ${f.viewport}: ${f.label}`);
      lines.push("");
      lines.push(`- Route: \`${f.path}\``);
      lines.push(`- Role: \`${f.role}\``);
      lines.push(`- Issue: ${f.issue}`);
      if (f.screenshot) {
        lines.push(`- Screenshot: [${path.basename(f.screenshot)}](${rel(f.screenshot)})`);
        lines.push("");
        lines.push(`![${f.viewport} ${f.label}](${rel(f.screenshot)})`);
      }
      if (f.details?.length) {
        lines.push("");
        lines.push("Potential wide elements:");
        for (const d of f.details) {
          lines.push(`- ${d.tag} width=${d.width}px text="${d.text}"`);
        }
      }
      lines.push("");
    }
  }
  lines.push("## Passed Checks");
  lines.push("");
  for (const p of passes) {
    lines.push(`- PASS [${p.viewport}] ${p.label}: \`${p.path}\``);
  }
  lines.push("");
  return lines.join("\n");
}

const staticRoutes = [
  { label: "Landing page", path: "/", role: "public" },
  { label: "About us", path: "/about-us", role: "public" },
  { label: "Membership", path: "/membership", role: "public" },
  { label: "Courses catalog", path: "/courses", role: "public" },
  { label: "Course detail", path: "/courses/foundations-of-infant-toddler-caregiving", role: "public" },
  { label: "Events catalog", path: "/events", role: "public" },
  { label: "Event detail", path: "/events/montessori-club-babies-toddlers", role: "public" },
  { label: "Event registration", path: "/events/montessori-club-babies-toddlers/register", role: "parent" },
  { label: "Marketplace landing", path: "/marketplace", role: "public" },
  { label: "Parent dashboard", path: "/dashboard", role: "parent" },
  { label: "Parent My Courses", path: "/courses/my", role: "parent" },
  { label: "Parent My Events", path: "/events/my", role: "parent" },
  { label: "Parent Find Care", path: "/connect", role: "parent" },
  { label: "Parent My Care Posts", path: "/dashboard/posts", role: "parent" },
  { label: "Parent Family", path: "/dashboard/family", role: "parent" },
  { label: "Parent Settings", path: "/dashboard/settings", role: "parent" },
  { label: "Parent Chat", path: "/chat", role: "parent" },
  { label: "Caregiver dashboard", path: "/dashboard", role: "caregiver" },
  { label: "Caregiver Profile", path: "/profile", role: "caregiver" },
  { label: "Caregiver Find Jobs", path: "/jobs", role: "caregiver" },
  { label: "Caregiver Applications", path: "/dashboard/applications", role: "caregiver" },
  { label: "Caregiver Meet Caregivers", path: "/connect", role: "caregiver" },
  { label: "Caregiver Chat", path: "/chat", role: "caregiver" },
  { label: "Organization dashboard", path: "/dashboard", role: "org" },
  { label: "Organization events", path: "/manage/events", role: "org" },
  { label: "Organization roles", path: "/organization/roles", role: "org" },
  { label: "Organization profile", path: "/organization", role: "org" },
];

const dynamicRoutes = await collectDynamicRoutes();
const routes = [...staticRoutes, ...dynamicRoutes];

const browser = await chromium.launch({ headless: true });

for (const viewport of viewports) {
  const contexts = new Map();
  async function contextFor(role) {
    const key = role ?? "public";
    if (contexts.has(key)) return contexts.get(key);
    const context = await browser.newContext({
      viewport: { width: viewport.width, height: viewport.height },
      isMobile: viewport.name === "mobile",
      hasTouch: viewport.name === "mobile",
    });
    const page = await context.newPage();
    if (role && role !== "public") await signIn(page, role);
    contexts.set(key, { context, page });
    return { context, page };
  }

  for (const route of routes) {
    const { page } = await contextFor(route.role);
    await checkPage(page, viewport.name, route);
  }

  for (const { context } of contexts.values()) await context.close();
}

await browser.close();

const reportPath = path.join(OUT, "responsive-qa-report.md");
fs.writeFileSync(reportPath, reportMarkdown());

const passCount = results.filter((r) => r.pass).length;
console.log(`\n===== RESPONSIVE QA: ${passCount}/${results.length} passed =====`);
console.log(`Report: ${reportPath}`);
process.exit(passCount === results.length ? 0 : 1);
