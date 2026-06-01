import { createClient } from "@/lib/supabase/server";

/**
 * The single entry point for raising a notification. Domain code (events,
 * courses, marketplace) calls this with the recipient + a bag of template vars
 * it assembles from data it already has in hand. Rendering + delivery happen in
 * the create_notification() RPC (SECURITY DEFINER), which reads the stored
 * template — so callers can pick the type, vars, and recipient, but never the
 * body text itself.
 *
 * Fail-soft by design: a notification must never break the parent action. Any
 * error is logged and swallowed.
 */
export async function emitNotification(input: {
  typeKey: string;
  userId: string;
  vars?: Record<string, string | number | null | undefined>;
  link?: string | null;
}): Promise<void> {
  try {
    const supabase = await createClient();

    // Coerce every var to a string for the {{token}} substitution.
    const vars: Record<string, string> = {};
    for (const [key, value] of Object.entries(input.vars ?? {})) {
      vars[key] = value == null ? "" : String(value);
    }

    const { error } = await supabase.rpc("create_notification", {
      p_user_id: input.userId,
      p_type_key: input.typeKey,
      p_vars: vars,
      p_link: input.link ?? null,
    });

    if (error) {
      console.error(`[notifications] emit failed for ${input.typeKey}:`, error.message);
    }
  } catch (err) {
    console.error(`[notifications] emit threw for ${input.typeKey}:`, err);
  }
}
