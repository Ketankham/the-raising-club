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
