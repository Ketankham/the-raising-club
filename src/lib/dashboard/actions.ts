"use server";

import { createClient } from "@/lib/supabase/server";

/**
 * Mark the first-run dashboard tour as completed for the current user, so it
 * never shows again (gated by profiles.dashboard_tour_completed_at). Guarded by
 * the session + RLS (a user may only update their own profile).
 */
export async function completeDashboardTour(): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };

  const { error } = await supabase
    .from("profiles")
    .update({ dashboard_tour_completed_at: new Date().toISOString() })
    .eq("id", user.id);

  return { ok: !error };
}
