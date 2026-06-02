import Link from "next/link";
import { CalendarPlus, Star } from "lucide-react";
import { requireEventManager } from "@/lib/guards";
import { listManagedEvents } from "@/lib/events/admin";
import { priceLabel, shortDateLabel } from "@/lib/events/format";
import type { PriceModel } from "@/lib/events/types";

export default async function AdminEventsPage() {
  const { isAdmin, orgIds, user } = await requireEventManager();
  const events = await listManagedEvents({ isAdmin, orgIds, userId: user.id });

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink">Events</h1>
            <p className="text-sm text-ink-soft">Create and manage your events.</p>
          </div>
          <Link
            href="/manage/events/new"
            className="inline-flex items-center gap-2 rounded-full bg-[#9cc766] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#8bb957]"
          >
            <CalendarPlus size={16} /> Create event
          </Link>
        </div>

        {events.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-12 text-center">
            <p className="font-display text-lg font-bold text-ink">No events yet</p>
            <p className="mt-1 text-sm text-ink-soft">Create your first event to get started.</p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead className="bg-cream/60 text-left text-xs font-semibold uppercase text-ink-soft">
                <tr>
                  <th className="px-4 py-3">Event</th>
                  <th className="px-4 py-3">Created by</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Price</th>
                  <th className="px-4 py-3">Registered</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-cream/40">
                    <td className="px-4 py-3">
                      <span className="flex items-center gap-1.5 font-semibold text-ink">
                        {e.isFeatured && <Star size={13} className="fill-yellow text-yellow" />}
                        {e.title}
                      </span>
                      <span className="text-xs text-ink-soft">{e.visibility}</span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      <span className="block font-medium text-ink">{e.orgName ?? e.createdBy ?? "—"}</span>
                      {e.orgName && e.createdBy && <span className="text-xs">{e.createdBy}</span>}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {e.nextStartsAt ? shortDateLabel(e.nextStartsAt) : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-lavender px-2.5 py-0.5 text-xs font-semibold text-ink">
                        {e.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {priceLabel(e.priceModel as PriceModel, e.priceCents)}
                    </td>
                    <td className="px-4 py-3 text-ink-soft">
                      {e.registrationCount}
                      {e.childCapacity != null ? ` / ${e.childCapacity}` : ""}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <a
                        href={`/events/${e.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-semibold text-[#7ba84f] hover:underline"
                        title={e.status === "published" ? "Open the live event page" : "Preview the event page"}
                      >
                        View
                      </a>
                      <span className="mx-2 text-ink-soft/40">·</span>
                      <Link href={`/manage/events/${e.id}/roster`} className="font-semibold text-[#7ba84f] hover:underline">
                        Roster
                      </Link>
                      <span className="mx-2 text-ink-soft/40">·</span>
                      <Link href={`/manage/events/${e.id}/edit`} className="font-semibold text-ink-soft hover:text-ink">
                        Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
    </div>
  );
}
