"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
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
  expanded = false,
  variant = "sidebar",
}: {
  initialUnread: number;
  /** Sidebar variant only: show the text label when the rail is expanded. */
  expanded?: boolean;
  /** "sidebar" = pill row in the left rail; "header" = round icon button. */
  variant?: "sidebar" | "header";
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

  const badge =
    unread > 0 ? (
      <span className="absolute -right-1.5 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-[#e0466e] px-1 text-[0.6rem] font-bold text-white">
        {unread > 9 ? "9+" : unread}
      </span>
    ) : null;

  const trigger =
    variant === "header" ? (
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="relative grid h-9 w-9 place-items-center rounded-full text-ink-soft transition hover:bg-white hover:text-ink"
      >
        <Bell className="h-5 w-5" />
        {badge}
      </button>
    ) : (
      <button
        onClick={toggle}
        aria-label="Notifications"
        className="group relative mx-2 mb-1 flex w-[calc(100%-1rem)] items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-ink-soft transition hover:bg-white/60 hover:text-ink"
      >
        <span className="relative shrink-0">
          <Bell className="h-5 w-5" />
          {badge}
        </span>
        <span className={`${labelCls} whitespace-nowrap`}>Notifications</span>
        {!expanded && (
          <span className="pointer-events-none absolute left-full top-1/2 z-50 ml-2 hidden -translate-y-1/2 whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-white group-hover:block">
            Notifications
          </span>
        )}
      </button>
    );

  // Panel is portaled to <body> at a high z-index so it always renders ahead of
  // page chrome (headers, sticky bars, sidebar) and is never clipped. Anchored
  // top-right like a header dropdown.
  const panel =
    open && typeof document !== "undefined"
      ? createPortal(
          <>
            {/* click-away backdrop */}
            <button
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-[190] cursor-default bg-ink/10"
            />
            <div className="fixed right-3 top-[68px] z-[200] flex max-h-[min(72vh,560px)] w-[360px] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-2xl">
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
          </>,
          document.body,
        )
      : null;

  return (
    <>
      {trigger}
      {panel}
    </>
  );
}
