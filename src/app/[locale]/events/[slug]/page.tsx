import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventDetail } from "@/components/events/event-detail";
import { getEventBySlug, getMyRegistration, getRegistrationDetails } from "@/lib/events/queries";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return { title: "Event — The Raising Club" };
  return {
    title: `${event.title} — The Raising Club`,
    description: event.summary ?? undefined,
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const registration = await getMyRegistration(event.id);
  const registrationDetails = registration ? await getRegistrationDetails(event.id) : null;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-5 py-5 lg:px-8">
          <Link href="/events" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Upcoming Events
          </Link>
        </div>
        <EventDetail event={event} registration={registration} registrationDetails={registrationDetails} />
      </main>
      <SiteFooter />
    </>
  );
}
