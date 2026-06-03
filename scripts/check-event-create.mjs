/**
 * Validates the SECOND half of the org journey (dashboard -> create event)
 * without touching onboarding/email: signs in as the existing QA org account
 * and creates a DRAFT event, confirming the selectors + permissions work.
 *
 * Run: BASE=https://the-raising-club.vercel.app node scripts/check-event-create.mjs
 */
import { chromium } from "playwright";

const BASE = process.env.BASE || "https://the-raising-club.vercel.app";
const EMAIL = process.env.QA_EMAIL || "qa-org@raisingclub-test.dev";
const PASSWORD = process.env.QA_PASSWORD || "RaisingQA!2026";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

try {
  console.log("▶ Sign in as QA org");
  await page.goto(`${BASE}/sign-in`, { waitUntil: "domcontentloaded" });
  await sleep(1500); // let React hydrate before interacting
  await page.getByLabel("Email").fill(EMAIL);
  await page.getByLabel("Password").fill(PASSWORD);
  // Click, and retry once if still on /sign-in (guards against a pre-hydration no-op).
  for (let i = 0; i < 3; i++) {
    await page.getByRole("button", { name: "Sign in" }).click();
    try {
      await page.waitForURL("**/dashboard", { timeout: 12000 });
      break;
    } catch {
      if (page.url().includes("/sign-in")) {
        await sleep(1000);
        continue;
      }
      throw new Error(`unexpected post-signin URL: ${page.url()}`);
    }
  }
  if (page.url().includes("/sign-in")) throw new Error("sign-in did not navigate to /dashboard");
  console.log("  on dashboard:", page.url());

  console.log("▶ Dismiss welcome tour if present");
  {
    const skip = page.getByRole("button", { name: "Skip the tour" });
    await skip.waitFor({ timeout: 5000 }).catch(() => {});
    if (await skip.isVisible().catch(() => false)) await skip.click();
  }

  console.log("▶ Open Events from the left sidebar");
  await page.locator('aside a[href="/manage/events"]').first().click();
  await page.waitForURL("**/manage/events", { timeout: 30000 });

  console.log("▶ New event");
  await page.locator('a[href="/manage/events/new"]').first().click();
  await page.waitForURL("**/manage/events/new", { timeout: 30000 });
  await page.getByLabel("Title").waitFor();

  console.log("▶ Fill + create (Draft)");
  await page.getByLabel("Title").fill("QA selector check (delete me)");
  await page.getByLabel("Short summary").fill("Temporary draft created by the selector-validation script.");
  await page.getByLabel("Starts").fill("2026-07-15T10:00");
  await page.getByLabel("Ends", { exact: true }).fill("2026-07-15T10:45");
  await page.getByLabel("Min age (months)").fill("12");
  await page.getByLabel("Max age (months)").fill("36");
  await page.getByLabel("Neighborhood (shown first)").fill("Brooklyn");
  await page.getByRole("button", { name: "Create event" }).click();
  const ok = page.waitForURL("**/manage/events/**/roster", { timeout: 30000 });
  const err = page
    .locator("div.bg-pink")
    .first()
    .waitFor({ state: "visible", timeout: 30000 })
    .then(async () => {
      const t = await page.locator("div.bg-pink").first().textContent();
      throw new Error(`createEvent error: ${t?.trim()}`);
    });
  await Promise.race([ok, err]);

  const m = page.url().match(/admin\/events\/([0-9a-f-]+)\/roster/);
  console.log("\n✅ Event created (Draft). Roster URL:", page.url());
  console.log("   event id:", m?.[1]);
} catch (e) {
  console.error("\n❌ Validation failed:", e.message);
  await page.screenshot({ path: "../_recordings/check-failure.png", fullPage: true }).catch(() => {});
  process.exitCode = 1;
} finally {
  await context.close();
  await browser.close();
}
