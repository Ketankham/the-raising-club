/**
 * Audits Spanish translation coverage for static/public pages on the live site.
 *
 * Covers:
 * - language toggle behavior
 * - landing, terms, privacy, membership tabs, marketplace, about us, manifesto
 * - obvious English text remaining on /es pages
 * - screenshots for issue pages
 *
 * Run from web/:
 *   $env:BASE="https://theraisingclub.com"
 *   node scripts/audit-spanish-static-live.mjs
 */
import { chromium } from "../../qa-recordings/node_modules/playwright/index.mjs";
import path from "node:path";
import fs from "node:fs";

const BASE = (process.env.BASE || "https://theraisingclub.com").replace(/\/$/, "");
const ts = Date.now();
const tag = String(ts).slice(-5);
const OUT = path.resolve(process.cwd(), "..", "qa-recordings", "screenshots", `spanish-static-audit-${tag}`);
fs.mkdirSync(OUT, { recursive: true });

const pages = [
  {
    key: "landing",
    label: "Landing page",
    path: "/",
    spanishMustInclude: ["Más que cuidado infantil", "El club", "Cómo funciona"],
    englishRedFlags: ["More Than Childcare", "How It Works", "Who We Serve", "Ready to Join"],
  },
  {
    key: "terms",
    label: "Terms",
    path: "/terms",
    spanishMustInclude: ["Términos", "Bienvenido"],
    englishRedFlags: ["Terms & Conditions", "Welcome to The Raising Club", "Please read"],
  },
  {
    key: "privacy",
    label: "Privacy",
    path: "/privacy",
    spanishMustInclude: ["Privacidad", "Fecha efectiva"],
    englishRedFlags: ["Privacy Policy", "Effective date", "Last updated", "We collect", "We use"],
  },
  {
    key: "membership",
    label: "Membership",
    path: "/membership",
    spanishMustInclude: ["membresías", "Mensual", "Anual"],
    englishRedFlags: ["Membership", "Monthly", "Annual", "Families", "Caregiver", "Centers", "Billed"],
    interactions: "membership-tabs",
  },
  {
    key: "marketplace",
    label: "Marketplace",
    path: "/marketplace",
    spanishMustInclude: ["Mercado", "comunidades de cuidado", "Padre", "Cuidador"],
    englishRedFlags: ["Marketplace", "Where care communities", "Parents", "Caregivers", "Get Started"],
  },
  {
    key: "about-us",
    label: "About us",
    path: "/about-us",
    spanishMustInclude: ["Quiénes somos", "aldea moderna", "fundadora"],
    englishRedFlags: ["About Us", "modern village", "Meet Our Founder", "Read our Manifesto"],
  },
  {
    key: "manifesto",
    label: "Manifesto",
    path: "/manifesto",
    spanishMustInclude: ["Manifiesto", "cuidado es educación"],
    englishRedFlags: ["Our Manifesto", "care is education", "Back to about", "Join the Club"],
  },
];

const results = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100);

function countMatches(text, phrases) {
  return phrases.filter((p) => text.toLowerCase().includes(p.toLowerCase()));
}

function rec(row) {
  results.push(row);
  const prefix = row.pass ? "PASS" : "FAIL";
  console.log(`${prefix} ${row.label}${row.detail ? " - " + row.detail : ""}`);
}

async function pageText(page) {
  return page.locator("body").innerText({ timeout: 20000 });
}

async function screenshot(page, name) {
  const file = path.join(OUT, `${slug(name)}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function auditPage(page, spec) {
  const spanishPath = spec.path === "/" ? "/es" : `/es${spec.path}`;
  await page.goto(`${BASE}${spanishPath}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(1000);

  const text = await pageText(page);
  const spanishHits = countMatches(text, spec.spanishMustInclude);
  const englishHits = countMatches(text, spec.englishRedFlags);
  const urlOk = new URL(page.url()).pathname.startsWith("/es");

  let membershipTabs = null;
  if (spec.interactions === "membership-tabs") {
    membershipTabs = [];
    for (const tabName of [/Famil/i, /Centro|Programa|Centers/i, /Cuidador|Educator|Caregiver/i]) {
      const button = page.getByRole("button", { name: tabName }).first();
      const exists = await button.isVisible().catch(() => false);
      if (exists) {
        await button.click();
        await sleep(500);
        const tabText = await pageText(page);
        membershipTabs.push({
          tab: String(tabName),
          textSample: tabText.slice(0, 400),
          englishHits: countMatches(tabText, spec.englishRedFlags),
        });
      } else {
        membershipTabs.push({ tab: String(tabName), missing: true });
      }
    }
  }

  const pass = urlOk && spanishHits.length > 0 && englishHits.length === 0 &&
    (!membershipTabs || membershipTabs.every((t) => !t.missing && t.englishHits.length === 0));
  const shot = pass ? "" : await screenshot(page, `issue-${spec.key}`);

  rec({
    type: "page",
    key: spec.key,
    label: spec.label,
    path: spanishPath,
    pass,
    url: page.url(),
    spanishHits,
    englishHits,
    membershipTabs,
    screenshot: shot,
    detail: pass ? "Spanish content rendered" : `Spanish hits: ${spanishHits.join(", ") || "none"}; English hits: ${englishHits.join(", ") || "none"}`,
  });
}

async function auditToggle(page) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(700);
  const esButton = page.getByRole("button", { name: /^ES$/ }).first();
  await esButton.click();
  await page.waitForURL("**/es", { timeout: 15000 }).catch(() => {});
  await sleep(700);
  const esText = await pageText(page);
  const switchedToEs = new URL(page.url()).pathname === "/es" && /Más que cuidado infantil|El club/i.test(esText);
  rec({
    type: "toggle",
    key: "toggle-home-es",
    label: "Toggle EN -> ES on landing",
    path: "/",
    pass: switchedToEs,
    url: page.url(),
    screenshot: switchedToEs ? "" : await screenshot(page, "issue-toggle-home-es"),
    detail: switchedToEs ? "ES route and Spanish hero loaded" : "Toggle did not load Spanish landing content",
  });

  const enButton = page.getByRole("button", { name: /^EN$/ }).first();
  await enButton.click();
  await page.waitForURL((url) => !url.pathname.startsWith("/es"), { timeout: 15000 }).catch(() => {});
  await sleep(700);
  const enText = await pageText(page);
  const switchedToEn = new URL(page.url()).pathname === "/" && /More Than Childcare/i.test(enText);
  rec({
    type: "toggle",
    key: "toggle-home-en",
    label: "Toggle ES -> EN on landing",
    path: "/es",
    pass: switchedToEn,
    url: page.url(),
    screenshot: switchedToEn ? "" : await screenshot(page, "issue-toggle-home-en"),
    detail: switchedToEn ? "EN route and English hero loaded" : "Toggle did not return to English landing content",
  });

  await page.goto(`${BASE}/es/about-us`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await sleep(700);
  await page.getByRole("link", { name: /Membresía|Afiliación/i }).first().click();
  await sleep(900);
  const navPath = new URL(page.url()).pathname;
  const navText = await pageText(page);
  const navPreservesSpanish = navPath.startsWith("/es") && /membres/i.test(navText) && !/Family memberships|Caregiver & Educator memberships/i.test(navText);
  rec({
    type: "navigation",
    key: "spanish-nav-preserves-locale",
    label: "Spanish header nav preserves /es locale",
    path: "/es/about-us -> membership nav",
    pass: navPreservesSpanish,
    url: page.url(),
    screenshot: navPreservesSpanish ? "" : await screenshot(page, "issue-spanish-nav-locale"),
    detail: navPreservesSpanish ? "Navigation stayed Spanish" : `Navigation landed on ${navPath}`,
  });
}

function rel(file) {
  return file ? path.relative(OUT, file).replaceAll("\\", "/") : "";
}

function markdown() {
  const fails = results.filter((r) => !r.pass);
  const passes = results.filter((r) => r.pass);
  const lines = [];
  lines.push("# Spanish Static Pages Translation QA");
  lines.push("");
  lines.push(`Date: ${new Date().toISOString()}`);
  lines.push(`Environment: ${BASE}`);
  lines.push(`Result: ${passes.length}/${results.length} checks passed`);
  lines.push(`Screenshots: \`${OUT}\``);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("- Spanish routing exists using `/es`.");
  lines.push("- The language toggle was tested on the landing page.");
  lines.push("- Header navigation was tested from a Spanish page.");
  lines.push("- Membership role tabs were tested on the Spanish membership page.");
  lines.push("");
  lines.push("## Issues / Left To Do");
  lines.push("");
  if (!fails.length) {
    lines.push("No translation issues were detected in this audit.");
  } else {
    for (const f of fails) {
      lines.push(`### ${f.label}`);
      lines.push("");
      lines.push(`- Path tested: \`${f.path}\``);
      lines.push(`- Final URL: \`${f.url}\``);
      lines.push(`- Issue: ${f.detail}`);
      if (f.englishHits?.length) lines.push(`- English text found: ${f.englishHits.map((x) => `\`${x}\``).join(", ")}`);
      if (f.spanishHits?.length) lines.push(`- Spanish text found: ${f.spanishHits.map((x) => `\`${x}\``).join(", ")}`);
      if (f.membershipTabs) {
        lines.push("- Membership tab audit:");
        for (const tab of f.membershipTabs) {
          lines.push(`  - ${tab.tab}: ${tab.missing ? "missing" : tab.englishHits.length ? `English found (${tab.englishHits.join(", ")})` : "ok"}`);
        }
      }
      if (f.screenshot) {
        lines.push(`- Screenshot: [${path.basename(f.screenshot)}](${rel(f.screenshot)})`);
        lines.push("");
        lines.push(`![${f.label}](${rel(f.screenshot)})`);
      }
      lines.push("");
    }
  }
  lines.push("## Passing Checks");
  lines.push("");
  for (const p of passes) {
    lines.push(`- PASS: ${p.label} (${p.path})`);
  }
  lines.push("");
  lines.push("## Raw Results");
  lines.push("");
  lines.push("```json");
  lines.push(JSON.stringify(results, null, 2));
  lines.push("```");
  lines.push("");
  return lines.join("\n");
}

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });

try {
  await auditToggle(page);
  for (const spec of pages) await auditPage(page, spec);
} finally {
  await browser.close();
}

const reportPath = path.join(OUT, "spanish-static-translation-report.md");
fs.writeFileSync(reportPath, markdown());
console.log(`\nReport: ${reportPath}`);
process.exit(results.every((r) => r.pass) ? 0 : 1);
