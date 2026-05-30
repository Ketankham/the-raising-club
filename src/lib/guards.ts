import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Require a signed-in user with a profile (no onboarding check). */
export async function requireUserProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();
  if (!profile) redirect("/sign-in");
  if (profile.deactivated_at) redirect("/deactivated");

  return { supabase, user, profile };
}

/** Require a fully-onboarded user (admins are exempt — they never onboard). */
export async function requireOnboardedProfile() {
  const ctx = await requireUserProfile();
  if (ctx.profile.role !== "admin" && !ctx.profile.onboarding_completed_at) {
    redirect("/onboarding/resume");
  }
  return ctx;
}

/** Require an admin. */
export async function requireAdmin() {
  const ctx = await requireUserProfile();
  if (ctx.profile.role !== "admin") redirect("/dashboard");
  return ctx;
}

/**
 * Require someone who can manage events: a platform admin, or an owner/admin of
 * at least one organization. Returns the manageable org ids (empty for admins,
 * who can manage everything).
 */
export async function requireEventManager() {
  const ctx = await requireUserProfile();
  if (ctx.profile.role === "admin") {
    return { ...ctx, isAdmin: true as const, orgIds: [] as string[] };
  }
  const { data } = await ctx.supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", ctx.user.id)
    .in("member_role", ["owner", "admin"])
    .eq("status", "active");
  const orgIds = (data ?? []).map((r: { org_id: string }) => r.org_id);
  if (orgIds.length === 0) redirect("/dashboard");
  return { ...ctx, isAdmin: false as const, orgIds };
}
