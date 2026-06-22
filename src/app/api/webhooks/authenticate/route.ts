import "server-only";
import { handleAuthenticateWebhook } from "@/lib/authenticate/webhook-handlers";
import type { AuthWebhookPayload } from "@/lib/authenticate/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/authenticate
 * Receives event notifications from Authenticate (authenticate.com).
 * Intentionally outside [locale] so the URL is always /api/webhooks/authenticate
 * regardless of locale — external services need a stable, prefix-free URL.
 */
export async function POST(request: Request) {
  // Authenticate sends the API key as the auth credential on webhook calls.
  // Accept either AUTHENTICATE_WEBHOOK_SECRET (if set) or AUTHENTICATE_API_KEY as valid secrets.
  const webhookSecret = process.env.AUTHENTICATE_WEBHOOK_SECRET;
  const apiKey = process.env.AUTHENTICATE_API_KEY;
  const validSecrets = [webhookSecret, apiKey].filter(Boolean) as string[];

  if (validSecrets.length > 0) {
    const sig =
      request.headers.get("x-authenticate-signature") ??
      request.headers.get("x-webhook-secret") ??
      request.headers.get("authorization")?.replace("Bearer ", "");
    if (!sig || !validSecrets.includes(sig)) {
      console.warn("[authenticate webhook] signature mismatch — got:", sig?.slice(0, 8));
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: AuthWebhookPayload;
  try {
    payload = (await request.json()) as AuthWebhookPayload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  console.log("[authenticate webhook] received event:", payload.event, "userCode:", payload.userCode?.slice(0, 8));

  if (!payload.event || !payload.userCode) {
    return Response.json({ error: "Missing event or userCode" }, { status: 400 });
  }

  // Acknowledge immediately; process async so Authenticate doesn't time out waiting
  handleAuthenticateWebhook(payload).catch((err) =>
    console.error("[authenticate webhook] handler threw:", err)
  );

  return Response.json({ ok: true });
}
