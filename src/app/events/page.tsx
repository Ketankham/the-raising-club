import type { Metadata } from "next";
import { Search } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { EventsFilters } from "@/components/events/events-filters";
import { EventCard } from "@/components/events/event-card";
import { listEvents, parseFilters } from "@/lib/events/queries";

export const metadata: Metadata = {
  title: "Upcoming Events — The Raising Club",
  description: "Spaces to gather and grow together. Discover and enroll in childcare events.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const filters = parseFilters(sp);
  const events = await listEvents(filters);

  // Preserve active filters when submitting the search form (no-JS friendly).
  const hidden: { name: string; value: string }[] = [];
  for (const k of ["ageMax", "priceMax", "join", "who", "style", "date"]) {
    const v = sp[k];
    const val = Array.isArray(v) ? v[0] : v;
    if (val) hidden.push({ name: k, value: val });
  }

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-7xl px-5 py-10 lg:px-8 lg:py-14">
          <header className="mb-8">
            <h1 className="font-display text-3xl font-bold text-ink lg:text-4xl">
              Upcoming Events
            </h1>
            <p className="mt-2 text-ink-soft">Spaces to gather and grow together</p>

            <form action="/events" method="get" className="mt-6 max-w-md">
              {hidden.map((h) => (
                <input key={h.name} type="hidden" name={h.name} value={h.value} />
              ))}
              <div className="relative">
                <Search
                  size={18}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-soft/60"
                />
                <input
                  type="search"
                  name="q"
                  defaultValue={filters.q ?? ""}
                  placeholder="Search events..."
                  className="w-full rounded-full border border-ink/15 bg-white py-3 pl-11 pr-4 text-sm text-ink shadow-sm outline-none focus:border-[#9cc766]"
                />
              </div>
            </form>
          </header>

          <div className="lg:flex lg:gap-8">
            <EventsFilters initial={filters} />

            <div className="flex-1">
              {events.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
                  <p className="font-display text-lg font-bold text-ink">No events found</p>
                  <p className="mt-1 text-sm text-ink-soft">
                    Try adjusting your filters or check back soon for new gatherings.
                  </p>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {events.map((ev) => (
                    <EventCard key={ev.id} event={ev} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
