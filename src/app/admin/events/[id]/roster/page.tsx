import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Pencil } from "lucide-react";
import { requireEventManager } from "@/lib/guards";
import { AppHeader } from "@/components/app/app-header";
import { RosterView } from "@/components/events/admin/roster-view";
import { getEventForEdit, getRoster } from "@/lib/events/admin";

export default async function RosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { profile } = await requireEventManager();
  const { id } = await params;

  const ev = await getEventForEdit(id);
  if (!ev) notFound();
  const roster = await getRoster(id);

  return (
    <>
      <AppHeader name={profile.preferred_name || profile.first_name || undefined} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin/events" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Back to events
        </Link>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{ev.title}</h1>
            <p className="text-sm text-ink-soft">Roster &amp; attendance</p>
          </div>
          <div className="flex gap-3">
            <Link href={`/events/${ev.slug}`} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30">
              View page
            </Link>
            <Link href={`/admin/events/${ev.id}/edit`} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
              <Pencil size={14} /> Edit
            </Link>
          </div>
        </div>
        <RosterView entries={roster} />
      </main>
    </>
  );
}
