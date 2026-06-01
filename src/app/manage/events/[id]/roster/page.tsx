import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Download, MessagesSquare, Pencil } from "lucide-react";
import { requireEventManager } from "@/lib/guards";
import { RosterView } from "@/components/events/admin/roster-view";
import { getEventForEdit, getRoster } from "@/lib/events/admin";

export default async function RosterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEventManager();
  const { id } = await params;

  const ev = await getEventForEdit(id);
  if (!ev) notFound();
  const roster = await getRoster(id);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/manage/events" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Back to events
      </Link>
      <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">{ev.title}</h1>
            <p className="text-sm text-ink-soft">Roster &amp; attendance</p>
          </div>
          <div className="flex gap-3">
            <Link
              href={`/manage/events/${ev.id}/messages`}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:border-[#9cc766]"
            >
              <MessagesSquare size={14} /> Messages
            </Link>
            <a
              href={`/manage/events/${ev.id}/roster/export`}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:border-[#9cc766]"
            >
              <Download size={14} /> Export CSV
            </a>
            <Link href={`/events/${ev.slug}`} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink hover:border-ink/30">
              View page
            </Link>
            <Link href={`/manage/events/${ev.id}/edit`} className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white">
              <Pencil size={14} /> Edit
            </Link>
          </div>
        </div>
      <RosterView entries={roster} />
    </div>
  );
}
