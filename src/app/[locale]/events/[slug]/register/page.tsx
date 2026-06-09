import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RegisterFlow } from "@/components/events/register-flow";
import { StartGuestRegistration } from "@/components/events/start-guest-registration";
import { getMyRegistration, getRegistrationContext } from "@/lib/events/queries";

export const metadata: Metadata = { title: "Register — The Raising Club" };

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Register-first, onboard-later: guests don't sign in up front. Bootstrap an
  // anonymous session, then the wizard's step 0 upgrades them to a real account.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return <StartGuestRegistration slug={slug} />;

  // A user without `registered_at` is still anonymous → show the account step.
  const { data: profile } = await supabase
    .from("profiles")
    .select("registered_at")
    .eq("id", user.id)
    .maybeSingle();
  const needsAccount = !profile?.registered_at;

  const context = await getRegistrationContext(slug);
  if (!context) notFound();

  // Already registered → send them to the event (Detail B).
  const existing = await getMyRegistration(context.eventId);
  if (existing) redirect(`/events/${slug}`);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <RegisterFlow context={context} needsAccount={needsAccount} />
      </main>
      <SiteFooter />
    </>
  );
}
