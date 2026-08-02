import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { ArrowLeft, Download, MessagesSquare, Pencil } from "lucide-react";
import QRCode from "qrcode";
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

  const h = await headers();
  const host = h.get("host") ?? "theraisingclub.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const checkInUrl = `${proto}://${host}/events/${ev.slug}/check-in`;
  const checkInQr = await QRCode.toDataURL(checkInUrl, { margin: 1, width: 220 });

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

      <div className="mb-6 flex flex-wrap items-center gap-5 rounded-2xl border border-[#baaae1] bg-lavender p-5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={checkInQr}
          alt="Event check-in QR code"
          className="h-28 w-28 shrink-0 rounded-lg border border-black/10 bg-white p-2"
        />
        <div className="min-w-0">
          <p className="font-display text-sm font-bold text-ink">Attendance check-in</p>
          <p className="mt-1 text-sm text-ink-soft">
            Print this and display it at the venue. Registered participants scan it, sign in, and mark
            themselves present — no rewards, attendance only.
          </p>
          <a href={checkInQr} download={`${ev.slug}-checkin-qr.png`} className="mt-2 inline-block text-sm font-semibold text-[#7ba84f] hover:underline">
            Download QR image
          </a>
        </div>
      </div>

      <RosterView entries={roster} eventId={ev.id} />
    </div>
  );
}
