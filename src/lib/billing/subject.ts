import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ensureHousehold, findHousehold } from "@/lib/household/server";

export type BillingSubject = { subjectType: "user" | "household" | "org"; subjectId: string };

/**
 * The billing subject a plan attaches to, by role:
 *   parent       → their household (shared family subscription)
 *   organization → the org they own
 *   caregiver    → themselves
 * Pass create=true to materialise a household for a parent who has none.
 */
export async function resolveBillingSubject(
  client: SupabaseClient,
  userId: string,
  role: string | null,
  opts: { create?: boolean; householdName?: string | null } = {},
): Promise<BillingSubject | null> {
  if (role === "organization") {
    const { data } = await client
      .from("organizations")
      .select("id")
      .eq("owner_user_id", userId)
      .limit(1)
      .maybeSingle();
    if (data) return { subjectType: "org", subjectId: data.id as string };
    return { subjectType: "user", subjectId: userId };
  }

  if (role === "parent") {
    const householdId = opts.create
      ? await ensureHousehold(client, userId, opts.householdName ?? null)
      : await findHousehold(client, userId);
    if (householdId) return { subjectType: "household", subjectId: householdId };
    // No household and not creating one — fall back to the individual.
    return { subjectType: "user", subjectId: userId };
  }

  // caregiver (and any other role): individual subject.
  return { subjectType: "user", subjectId: userId };
}
