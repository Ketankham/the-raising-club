import "server-only";
import { handleAuthenticateWebhook } from "@/lib/authenticate/webhook-handlers";
import type { AuthWebhookPayload } from "@/lib/authenticate/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/webhooks/authenticate
 * Receives event notifications from Authenticate (authenticate.com).
 * If AUTHENTICATE_WEBHOOK_SECRET is set, validates it against the incoming
 * header before processing. Responds 200 immediately; processing is async so
 * Authenticate doesn't time out waiting for DB writes. All handlers are
 * idempotent — Authenticate retries on non-2xx.
 */
export async function POST(request: Request) {
  const secret = process.env.AUTHENTICATE_WEBHOOK_SECRET;

  if (secret) {
    const sig =
      request.headers.get("x-authenticate-signature") ??
      request.headers.get("x-webhook-secret");
    if (!sig || sig !== secret) {
      console.warn("[authenticate webhook] signature mismatch");
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let payload: AuthWebhookPayload;
  try {
    payload = (await request.json()) as AuthWebhookPayload;
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!payload.event || !payload.userCode) {
    return Response.json({ error: "Missing event or userCode" }, { status: 400 });
  }

  // Acknowledge immediately; process async so Authenticate doesn't time out
  handleAuthenticateWebhook(payload).catch((err) =>
    console.error("[authenticate webhook] handler threw:", err)
  );

  return Response.json({ ok: true });
}
