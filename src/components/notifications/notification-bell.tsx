"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, X } from "lucide-react";
import { getFeed, markAllRead, markRead } from "@/lib/notifications/actions";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type NotificationCategory,
  type UserNotification,
} from "@/lib/notifications/types";

function formatWhen(iso: string): string {
  // Pure given the input (no Date.now()), client-only panel — no SSR mismatch.
  const d = new Date(iso);
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function groupItems(items: UserNotification[]): Array<[NotificationCategory, UserNotification[]]> {
  return CATEGORY_ORDER.map(
    (cat): [NotificationCategory, UserNotification[]] => [cat, items.filter((i) => i.category === cat)],
  ).filter(([, list]) => list.length > 0);
}

export function NotificationBell({
  initialUnread,
  expanded,
}: {
  initialUnread: number;
  expanded: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(initialUnread);

  async function openPanel() {
    setOpen(true);
    setLoading(true);
    const feed = await getFeed();
    setItems(feed.items);
    setUnread(feed.unread);
    setLoading(false);
  }

  function toggle() {
    if (open) setOpen(false);
    else void openPanel();
  }

  async function onMarkAll() {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date().toISOString() })));
    setUnread(0);
    await markAllRead();
  }

  async function onItemClick(item: UserNotification) {
    if (!item.readAt) {
      setItems((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, readAt: new Date().toISOString() } : i)),
      );
      setUnread((u) => Math.max(0, u - 1));
      await markRead([item.id]);
    }
    setOpen(false);
    if (item.link) router.push(item.link);
  }

  const grouped = groupItems(items);
  const labelCls = expanded ? "hidden lg:inline" : "hidden";

  return (
    <>
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="group relative mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition hover:bg-white/60 hover:text-ink"
      >
        <span className="relative shrink-0">
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e0466e] px-1 text-[0.6rem] font-bold text-white">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </span>
        <span className={`${labelCls} whitespace-nowrap`}>Notifications</span>
        {!expanded && (
          <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white group-hover:block">
            Notifications
          </span>
        )}
      </button>

      {open && (
        <>
          {/* click-away backdrop */}
          <button
            aria-label="Close notifications"
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="fixed bottom-4 left-[76px] z-50 flex max-h-[70vh] w-[360px] max-w-[calc(100vw-92px)] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-ink/5 px-4 py-3">
              <h2 className="font-display text-base font-semibold text-ink">Notifications</h2>
              <div className="flex items-center gap-1">
                {unread > 0 && (
                  <button
                    onClick={onMarkAll}
                    className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-medium text-ink-soft transition hover:bg-ink/5 hover:text-ink"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark all read
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="grid h-7 w-7 place-items-center rounded-lg text-ink-soft transition hover:bg-ink/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <p className="px-4 py-10 text-center text-sm text-ink-soft">Loading…</p>
              ) : items.length === 0 ? (
                <p className="px-4 py-10 text-center text-sm text-ink-soft">
                  You&apos;re all caught up.
                </p>
              ) : (
                grouped.map(([category, list]) => (
                  <section key={category}>
                    <h3 className="sticky top-0 bg-cream/90 px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-ink-soft backdrop-blur">
                      {CATEGORY_LABELS[category]}
                    </h3>
                    {list.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => onItemClick(item)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-cream/60 ${
                          item.readAt ? "" : "bg-primary/[0.04]"
                        }`}
                      >
                        {!item.readAt && (
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                        )}
                        <span className={`min-w-0 flex-1 ${item.readAt ? "pl-5" : ""}`}>
                          <span className="block truncate text-sm font-medium text-ink">
                            {item.title}
                          </span>
                          <span className="mt-0.5 block text-xs text-ink-soft">{item.body}</span>
                          <span className="mt-1 block text-[0.65rem] text-ink-soft/70">
                            {formatWhen(item.createdAt)}
                          </span>
                        </span>
                      </button>
                    ))}
                  </section>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
