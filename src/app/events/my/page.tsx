import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, CalendarDays, ImageIcon, MapPin } from "lucide-react";
import { AppHeader } from "@/components/app/app-header";
import { createClient } from "@/lib/supabase/server";
import { getMyEvents, type MyEventRow } from "@/lib/events/my-events";
import { LocalDateTime } from "@/components/events/local-datetime";
import { locationLabel } from "@/lib/events/format";

export const metadata = { title: "My Events — The Raising Club" };

export default async function MyEventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/sign-in?next=${encodeURIComponent("/events/my")}`);

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_name, first_name")
    .eq("id", user.id)
    .maybeSingle();
  const name = profile?.preferred_name || profile?.first_name || "there";

  const { upcoming, past } = await getMyEvents();
  const total = upcoming.length + past.length;

  return (
    <>
      <AppHeader
        name={name}
        nav={[
          { href: "/dashboard", label: "Dashboard home" },
          { href: "/events", label: "Browse events" },
          { href: "/events/my", label: "My events" },
          { href: "/courses/my", label: "My courses" },
        ]}
      />
      <main className="min-h-screen bg-cream/30">
        <div className="mx-auto max-w-6xl px-5 py-10 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl font-bold text-ink">Hello, {name}</h1>
              <p className="mt-1 text-ink-soft">Your gatherings — what&apos;s coming up and where you&apos;ve been.</p>
            </div>
            <Link
              href="/events"
              className="inline-flex items-center gap-2 rounded-full bg-[#9cc766] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8bb957]"
            >
              <CalendarDays size={16} /> Browse &amp; register
            </Link>
          </div>

          {total === 0 ? (
            <div className="mt-10 rounded-2xl border border-dashed border-ink/15 bg-white/60 p-12 text-center">
              <p className="font-display text-lg font-bold text-ink">No events yet</p>
              <p className="mt-1 text-sm text-ink-soft">
                Find a playdate, class, or gathering to join.
              </p>
              <Link
                href="/events"
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#9cc766] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8bb957]"
              >
                Browse events <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <div className="mt-8 space-y-10">
              {upcoming.length > 0 && (
                <Section title="Upcoming" subtitle="See you there." accent="#9cc766">
                  {upcoming.map((e) => <EventRowCard key={e.slug} e={e} upcoming />)}
                </Section>
              )}
              {past.length > 0 && (
                <Section title="Past" subtitle="Events you've attended." accent="#baaae1">
                  {past.map((e) => <EventRowCard key={e.slug} e={e} />)}
                </Section>
              )}
            </div>
          )}
        </div>
      </main>
    </>
  );
}

function Section({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-2.5">
        <span className="h-4 w-1.5 rounded-full" style={{ background: accent }} />
        <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      </div>
      <p className="ml-4 text-sm text-ink-soft">{subtitle}</p>
      <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </section>
  );
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Pending approval",
  waitlisted: "Waitlisted",
  approved: "Approved",
  cancelled: "Cancelled",
};

function EventRowCard({ e, upcoming }: { e: MyEventRow; upcoming?: boolean }) {
  const badge = STATUS_LABEL[e.registrationStatus];
  const badgeCls =
    e.registrationStatus === "cancelled"
      ? "bg-red-100 text-red-700"
      : "bg-yellow/60 text-ink";
  return (
    <Link
      href={`/events/${e.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={`aspect-[16/9] overflow-hidden bg-lavender ${upcoming ? "" : "opacity-90"}`}>
        {e.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={e.coverImageUrl} alt={e.title} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-ink-soft/30">
            <ImageIcon size={36} />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-2 font-display font-bold text-ink">{e.title}</h3>
          {badge && (
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-[0.65rem] font-semibold ${badgeCls}`}>
              {badge}
            </span>
          )}
        </div>
        {e.hostName && <p className="mt-0.5 text-xs text-ink-soft">by {e.hostName}</p>}

        <ul className="mt-3 space-y-1.5 text-sm text-ink-soft">
          {e.startsAt && (
            <li className="flex items-center gap-2">
              <CalendarDays size={15} className="shrink-0 text-ink-soft/70" />
              <LocalDateTime startIso={e.startsAt} mode="shortdate" />
            </li>
          )}
          {e.location && (
            <li className="flex items-center gap-2">
              <MapPin size={15} className="shrink-0 text-ink-soft/70" />
              {locationLabel(e.location)}
            </li>
          )}
        </ul>

        <span className="mt-auto pt-4 text-sm font-semibold text-[#7ba84f] group-hover:underline">
          {upcoming ? "View details" : "View"} →
        </span>
      </div>
    </Link>
  );
}
