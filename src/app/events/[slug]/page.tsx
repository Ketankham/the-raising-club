import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventDetail } from "@/components/events/event-detail";
import { getEventBySlug, getMyRegistration } from "@/lib/events/queries";

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

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <EventDetail event={event} registration={registration} />
      </main>
      <SiteFooter />
    </>
  );
}
