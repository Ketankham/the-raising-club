import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock, MapPin, QrCode } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { getEventBySlug, getMyRegistration } from "@/lib/events/queries";
import { CheckInConfirm } from "@/components/events/check-in-confirm";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  return { title: event ? `Check in — ${event.title}` : "Check in — The Raising Club" };
}

function timeLabel(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-lg px-5 py-16">
          <div className="rounded-2xl border border-[#baaae1] bg-lavender p-8 text-center shadow-sm">
            {children}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

/**
 * Venue-poster QR check-in. One QR per event (shown to organizers/admin on
 * the roster page) points here; any registrant can scan it with their own
 * phone. Requires sign-in, then self-confirms attendance on their own
 * registration — no rewards, attendance only (contrast with the sponsorship
 * reward flow on other Live-En-Synergy-style products).
 */
export default async function EventCheckInPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent(`/events/${slug}/check-in`)}`);

  const event = await getEventBySlug(slug);
  if (!event) {
    return (
      <Shell>
        <QrCode size={48} className="mx-auto text-[#8b76c2]" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Check-in link not recognised</h1>
        <p className="mt-2 text-sm text-ink-soft">This event doesn&apos;t exist or is no longer available.</p>
      </Shell>
    );
  }

  const registration = await getMyRegistration(event.id);

  if (!registration) {
    return (
      <Shell>
        <QrCode size={48} className="mx-auto text-[#8b76c2]" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">You&apos;re not registered</h1>
        <p className="mt-2 text-sm text-ink-soft">
          We couldn&apos;t find a registration for <strong>{event.title}</strong> under your account.
        </p>
        <Link
          href={`/events/${slug}`}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#9cc766] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8bb957]"
        >
          View event
        </Link>
      </Shell>
    );
  }

  if (registration.status === "pending") {
    return (
      <Shell>
        <Clock size={48} className="mx-auto text-[#8b76c2]" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">Still awaiting approval</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Your registration for <strong>{event.title}</strong> hasn&apos;t been approved yet — check in once it&apos;s confirmed.
        </p>
      </Shell>
    );
  }

  if (registration.status === "waitlisted") {
    return (
      <Shell>
        <Clock size={48} className="mx-auto text-[#8b76c2]" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">You&apos;re on the waitlist</h1>
        <p className="mt-2 text-sm text-ink-soft">Check-in opens once you&apos;re confirmed off the waitlist.</p>
      </Shell>
    );
  }

  if (registration.checkedInAt) {
    return (
      <Shell>
        <CheckCircle2 size={48} className="mx-auto text-[#5f8a36]" />
        <h1 className="mt-4 font-display text-2xl font-bold text-ink">You&apos;re checked in</h1>
        <p className="mt-2 text-sm text-ink-soft">
          Marked present for <strong>{event.title}</strong> at {timeLabel(registration.checkedInAt)}.
        </p>
      </Shell>
    );
  }

  return (
    <Shell>
      <MapPin size={48} className="mx-auto text-[#8b76c2]" />
      <h1 className="mt-4 font-display text-2xl font-bold text-ink">You&apos;re here!</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Confirm you&apos;re at <strong>{event.title}</strong> to mark yourself present.
      </p>
      <CheckInConfirm eventId={event.id} slug={slug} />
    </Shell>
  );
}
