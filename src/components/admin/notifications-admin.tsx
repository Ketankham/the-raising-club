"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { toggleChannel } from "@/lib/notifications/actions";
import {
  CATEGORY_LABELS,
  CATEGORY_ORDER,
  type NotificationType,
} from "@/lib/notifications/types";

function Toggle({
  on,
  label,
  onChange,
}: {
  on: boolean;
  label: string;
  onChange: (next: boolean) => void;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      disabled={pending}
      onClick={() => start(() => onChange(!on))}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition disabled:opacity-50 ${
        on ? "bg-primary" : "bg-ink/15"
      }`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export function NotificationsAdmin({ types }: { types: NotificationType[] }) {
  const [rows, setRows] = useState(types);

  function setChannel(key: string, channel: "inapp" | "email", enabled: boolean) {
    // optimistic
    setRows((prev) =>
      prev.map((t) =>
        t.key === key
          ? { ...t, ...(channel === "inapp" ? { inappEnabled: enabled } : { emailEnabled: enabled }) }
          : t,
      ),
    );
    void toggleChannel(key, channel, enabled).then((res) => {
      if (!res.ok) {
        // revert on failure
        setRows((prev) =>
          prev.map((t) =>
            t.key === key
              ? {
                  ...t,
                  ...(channel === "inapp" ? { inappEnabled: !enabled } : { emailEnabled: !enabled }),
                }
              : t,
          ),
        );
      }
    });
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
        <p className="mt-1 text-sm text-ink-soft">
          Enable or disable each notification per channel, and edit the in-app and email bodies.
          Email delivery is not yet connected — emails are recorded but not sent.
        </p>
      </header>

      {CATEGORY_ORDER.map((category) => {
        const list = rows.filter((t) => t.category === category);
        if (list.length === 0) return null;
        return (
          <section key={category}>
            <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-soft">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-ink/10 bg-white">
              {list.map((t, i) => (
                <div
                  key={t.key}
                  className={`flex items-center gap-4 px-4 py-3 ${
                    i > 0 ? "border-t border-ink/5" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-ink">{t.name}</p>
                    {t.description && (
                      <p className="truncate text-xs text-ink-soft">{t.description}</p>
                    )}
                    <p className="mt-0.5 font-mono text-[0.65rem] text-ink-soft/60">{t.key}</p>
                  </div>

                  <div className="flex items-center gap-5">
                    <label className="flex flex-col items-center gap-1 text-[0.65rem] font-medium text-ink-soft">
                      In-app
                      <Toggle
                        on={t.inappEnabled}
                        label={`${t.name} in-app`}
                        onChange={(next) => setChannel(t.key, "inapp", next)}
                      />
                    </label>
                    <label className="flex flex-col items-center gap-1 text-[0.65rem] font-medium text-ink-soft">
                      Email
                      <Toggle
                        on={t.emailEnabled}
                        label={`${t.name} email`}
                        onChange={(next) => setChannel(t.key, "email", next)}
                      />
                    </label>
                  </div>

                  <Link
                    href={`/admin/notifications/${t.key}`}
                    className="flex items-center gap-1 rounded-lg border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink transition hover:bg-cream"
                  >
                    Edit <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}
