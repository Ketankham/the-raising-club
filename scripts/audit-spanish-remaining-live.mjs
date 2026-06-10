/**
 * Focused retest for remaining Spanish issues:
 * - ES -> EN toggle
 * - Spanish header nav locale preservation
 * - Privacy
 * - Membership tabs/content
 * - Marketplace
 */
import { chromium } from "../../qa-recordings/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = (process.env.BASE || "https://theraisingclub.com").replace(/\/$/, "");
const ts = Date.now();
const tag = String(ts).slice(-5);
const OUT = path.resolve(process.cwd(), "..", "qa-recordings", "screenshots", `spanish-remaining-audit-${tag}`);
fs.mkdirSync(OUT, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);
const results = [];

function matches(text, phrases) {
  return phrases.filter((p) => text.toLowerCase().includes(p.toLowerCase()));
}

async function text(page) {
  return page.locator("body").innerText({ timeout: 20000 });
}

async function shot(page, name) {
  const file = path.join(OUT, `${slug(name)}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

function rec(row) {
  results.push(row);
  console.log(`${row.pass ? "PASS" : "FAIL"} ${row.label}${row.detail ? " - " + row.detail : ""}`);
}

async function testToggle(page) {
  await page.goto(`${BASE}/es`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(800);
  await page.getByRole("button", { name: /^EN$/ }).first().click();
  await sleep(1500);
  const body = await text(page);
  const pass = new URL(page.url()).pathname === "/" && /More Than Childcare/i.test(body);
  rec({
    label: "ES -> EN toggle",
    path: "/es",
    pass,
    url: page.url(),
    screenshot: pass ? "" : await shot(page, "toggle-es-to-en"),
    detail: pass ? "Returned to English" : `Still at ${new URL(page.url()).pathname}`,
  });
}

async function testSpanishNav(page) {
  await page.goto(`${BASE}/es/about-us`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(800);
  const link = page.locator('a[href], button').filter({ hasText: /Afiliación|Membresía/i }).first();
  const exists = await link.isVisible().catch(() => false);
  if (exists) {
    await link.click();
    await sleep(1500);
  }
  const body = await text(page);
  const pathName = new URL(page.url()).pathname;
  const pass = pathName.startsWith("/es/") && pathName.includes("membership") && /membres/i.test(body);
  rec({
    label: "Spanish nav preserves locale",
    path: "/es/about-us -> membership",
    pass,
    url: page.url(),
    screenshot: pass ? "" : await shot(page, "spanish-nav-preserve-locale"),
    detail: pass ? "Stayed in Spanish membership" : `Landed at ${pathName}`,
  });
}

async function testPage(page, label, route, spanishMust, englishFlags) {
  await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(900);
  let body = await text(page);

  const tabResults = [];
  if (label === "Membership") {
    for (const tab of [/Famil/i, /Centro|Programa/i, /Cuidador/i]) {
      const btn = page.getByRole("button", { name: tab }).first();
      const visible = await btn.isVisible().catch(() => false);
      if (visible) {
        await btn.click();
        await sleep(450);
        const tabText = await text(page);
        tabResults.push({ tab: String(tab), english: matches(tabText, englishFlags) });
      } else {
        tabResults.push({ tab: String(tab), missing: true });
      }
    }
    body = await text(page);
  }

  const spanish = matches(body, spanishMust);
  const english = matches(body, englishFlags);
  const tabsPass = tabResults.every((t) => !t.missing && !t.english?.length);
  const pass = spanish.length > 0 && english.length === 0 && tabsPass;
  rec({
    label,
    path: route,
    pass,
    url: page.url(),
    spanish,
    english,
    tabResults,
    screenshot: pass ? "" : await shot(page, label),
    detail: pass ? "Spanish complete for tested phrases" : `English left: ${english.join(", ") || "none"}${tabResults.length ? "; tabs checked" : ""}`,
  });
}

function rel(file) {
  return file ? path.relative(OUT, file).replaceAll("\\", "/") : "";
}

function report() {
  const passCount = results.filter((r) => r.pass).length;
  const lines = [
    "# Spanish Remaining Issues Retest",
    "",
    `Date: ${new Date().toISOString()}`,
    `Environment: ${BASE}`,
    `Result: ${passCount}/${results.length} passed`,
    `Screenshots: \`${OUT}\``,
    "",
    "## Results",
    "",
  ];
  for (const r of results) {
    lines.push(`### ${r.pass ? "PASS" : "FAIL"}: ${r.label}`);
    lines.push("");
    lines.push(`- Path: \`${r.path}\``);
    lines.push(`- Final URL: \`${r.url}\``);
    if (r.detail) lines.push(`- Detail: ${r.detail}`);
    if (r.english?.length) lines.push(`- English found: ${r.english.map((x) => `\`${x}\``).join(", ")}`);
    if (r.spanish?.length) lines.push(`- Spanish found: ${r.spanish.map((x) => `\`${x}\``).join(", ")}`);
    if (r.tabResults?.length) {
      lines.push("- Membership tabs:");
      for (const t of r.tabResults) lines.push(`  - ${t.tab}: ${t.missing ? "missing" : t.english.length ? `English found: ${t.english.join(", ")}` : "ok"}`);
    }
    if (r.screenshot) {
      lines.push(`- Screenshot: [${path.basename(r.screenshot)}](${rel(r.screenshot)})`);
      lines.push("");
      lines.push(`![${r.label}](${rel(r.screenshot)})`);
    }
    lines.push("");
  }
  lines.push("## Raw JSON");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(results, null, 2));
  lines.push("```");
  return lines.join("\n");
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await testToggle(page);
  await testSpanishNav(page);
  await testPage(page, "Privacy", "/es/privacy", ["Privacidad", "Fecha efectiva"], ["Privacy Policy", "We collect", "We use"]);
  await testPage(page, "Membership", "/es/membership", ["membresías", "Mensual", "Anual"], ["Families", "Caregiver", "Centers", "START HERE", "Billed", "Join for Free"]);
  await testPage(page, "Marketplace", "/es/marketplace", ["Mercado", "comunidades de cuidado", "Padre", "Cuidador"], ["Marketplace", "Caregivers", "Get Started", "Parents"]);
} finally {
  await browser.close();
}

const reportPath = path.join(OUT, "spanish-remaining-retest-report.md");
fs.writeFileSync(reportPath, report());
console.log(`\nReport: ${reportPath}`);
process.exit(results.every((r) => r.pass) ? 0 : 1);
