import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { RegisterFlow } from "@/components/events/register-flow";
import { getMyRegistration, getRegistrationContext } from "@/lib/events/queries";

export const metadata: Metadata = { title: "Register — The Raising Club" };

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // Guests sign in first (the doc's "member onboarding" branch); they return here.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=/events/${slug}/register`);

  const context = await getRegistrationContext(slug);
  if (!context) notFound();

  // Already registered → send them to the event (Detail B).
  const existing = await getMyRegistration(context.eventId);
  if (existing) redirect(`/events/${slug}`);

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <RegisterFlow context={context} />
      </main>
      <SiteFooter />
    </>
  );
}
