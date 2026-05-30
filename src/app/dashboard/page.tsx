import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Minimal post-onboarding landing. The proxy already guarantees a permanent
 * signed-in user; here we do the DB-backed check the proxy intentionally skips:
 * if onboarding isn't finished, send them back to resume it.
 */
export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in?next=/dashboard");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, first_name, preferred_name, onboarding_completed_at")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.onboarding_completed_at) redirect("/onboarding/resume");

  const name = profile.preferred_name || profile.first_name || "there";

  return (
    <div className="min-h-screen bg-cream px-4 py-16">
      <div className="mx-auto max-w-2xl rounded-2xl bg-white p-10 text-center shadow-sm ring-1 ring-ink/5">
        <h1 className="font-display text-3xl font-bold text-ink">Welcome, {name} 👋</h1>
        <p className="mt-3 text-ink-soft">
          Your {profile.role} onboarding is complete. Your dashboard is coming next.
        </p>
      </div>
    </div>
  );
}
