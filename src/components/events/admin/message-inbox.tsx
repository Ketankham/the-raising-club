"use client";

import { useState } from "react";
import { MessagesSquare } from "lucide-react";
import type { EventThread } from "@/lib/events/message-types";
import { markThreadReadByOrganizer, postOrganizerMessage } from "@/lib/events/messages-actions";
import { MessageThread } from "@/components/events/message-thread";

/** Organizer inbox: thread list (one per registrant) + the selected conversation. */
export function MessageInbox({ threads }: { threads: EventThread[] }) {
  const [list, setList] = useState(threads);
  const [selectedId, setSelectedId] = useState<string | null>(threads[0]?.registrationId ?? null);
  const selected = list.find((t) => t.registrationId === selectedId) ?? null;

  function open(id: string) {
    setSelectedId(id);
    setList((l) => l.map((t) => (t.registrationId === id ? { ...t, unread: 0 } : t)));
    void markThreadReadByOrganizer(id);
  }

  if (threads.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-10 text-center text-sm text-ink-soft">
        No registrants yet — messages will appear here once people register.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <ul className="space-y-1 lg:max-h-[30rem] lg:overflow-y-auto">
        {list.map((t) => (
          <li key={t.registrationId}>
            <button
              type="button"
              onClick={() => open(t.registrationId)}
              className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left transition ${
                selectedId === t.registrationId ? "bg-white shadow-sm" : "hover:bg-white/60"
              }`}
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-lavender text-ink-soft">
                <MessagesSquare size={15} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-ink">{t.registrantName}</span>
                  {t.unread > 0 && (
                    <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[0.65rem] font-bold text-white">
                      {t.unread}
                    </span>
                  )}
                </span>
                <span className="block truncate text-xs text-ink-soft">
                  {t.messages.length ? t.messages[t.messages.length - 1].body : "No messages yet"}
                </span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="h-[30rem] rounded-2xl bg-cream/50 p-4">
        {selected ? (
          <MessageThread
            key={selected.registrationId}
            initial={selected.messages}
            myRole="organizer"
            onSend={(body) => postOrganizerMessage(selected.registrationId, body)}
            emptyHint={`Start the conversation with ${selected.registrantName}.`}
          />
        ) : (
          <p className="py-10 text-center text-sm text-ink-soft">Select a conversation.</p>
        )}
      </div>
    </div>
  );
}
