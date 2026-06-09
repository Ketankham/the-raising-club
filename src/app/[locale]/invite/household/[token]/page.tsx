import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptHouseholdInvitation } from "@/lib/household/actions";
import { HouseholdInviteSignup } from "@/components/household/invite-signup";
import { Logo } from "@/components/logo";

/**
 * Accept a family (household) invitation. Signed-in permanent users join
 * immediately and land in their Raising Club. New / signed-out visitors are sent
 * to create an account or sign in, returning here (and through the invited-adult
 * onboarding branch) afterward.
 */
export default async function AcceptHouseholdInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const next = `/invite/household/${token}`;

  let error: string | null = null;
  if (user && !user.is_anonymous) {
    const res = await acceptHouseholdInvitation(token);
    if (res.ok) redirect("/dashboard/family");
    error = res.error;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-4 text-center">
      <Logo />
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5">
        <h1 className="font-display text-xl font-bold text-ink">You&rsquo;ve been invited to a family</h1>
        <p className="mt-3 text-sm text-ink-soft">
          Join your family&rsquo;s Raising Club to share their membership, connect with other families, and help with care.
        </p>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <HouseholdInviteSignup token={token} signInNext={next} />
      </div>
    </div>
  );
}
