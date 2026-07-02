import "server-only";

// This route is intentionally production-blocked.
// It calls Authenticate's mock endpoints to trigger a real webhook without
// needing a physical ID document — useful for testing the full pipeline.
//
// Usage (GET):
//   /api/test/authenticate-mock?userCode=<code>&scenario=passport
//
// Scenarios: passport (default) | criminal | sex_offender | risk

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Hardcoded Authenticate test userAccessCodes (from their docs)
const TEST_CODES = {
  success: "100385a1-4308-49db-889f-9a898fa88c21",
  error1:  "2d91a19f-d07b-48f0-912f-886ed67009dd",
  error2:  "26682cb8-d672-4e0a-a26d-3b9a7cafab64",
};

const BASE = "https://api-v3.authenticating.com";

export async function GET(request: Request) {
  // Block on production
  if (process.env.VERCEL_ENV === "production") {
    return Response.json({ error: "Not available in production" }, { status: 403 });
  }

  const apiKey = process.env.AUTHENTICATE_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "AUTHENTICATE_API_KEY not set" }, { status: 500 });
  }

  const { searchParams } = new URL(request.url);
  const userCode = searchParams.get("userCode") ?? TEST_CODES.success;
  const scenario = searchParams.get("scenario") ?? "passport";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
  const body = JSON.stringify({ userAccessCode: userCode });

  const endpoints: Record<string, string> = {
    passport:    `${BASE}/mock/identity/passport/scan/data`,
    criminal:    `${BASE}/mock/identity/criminal/seven/year`,
    sex_offender:`${BASE}/mock/identity/criminal/sex-offender`,
    risk:        `${BASE}/mock/identity/risk/score`,
  };

  const url = endpoints[scenario] ?? endpoints.passport;

  const results: Record<string, unknown> = {};

  try {
    const res = await fetch(url, { method: "POST", headers, body });
    const data = await res.json();
    results[scenario] = { status: res.status, data };
  } catch (err) {
    results[scenario] = { error: String(err) };
  }

  return Response.json({
    userCode,
    scenario,
    endpoint: endpoints[scenario],
    results,
    note: "If the webhook URL is registered in Authenticate dashboard, a webhook will fire shortly.",
  });
}
