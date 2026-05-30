"use client";

import { useEffect, useState } from "react";
import { getMyEventThread, postMessageToEvent } from "@/lib/events/messages-actions";
import type { ThreadMessage } from "@/lib/events/message-types";
import { MessageThread } from "./message-thread";

/**
 * Attendee side of the "Message" tab: a two-way thread with the event organizer.
 * Rendered for registered users (Detail-B), so a registration always exists.
 */
export function MessageForm({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(true);
  const [registered, setRegistered] = useState(true);
  const [initial, setInitial] = useState<ThreadMessage[]>([]);

  useEffect(() => {
    let active = true;
    getMyEventThread(eventId).then((t) => {
      if (!active) return;
      setRegistered(t.registered);
      setInitial(t.messages);
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [eventId]);

  if (loading) return <p className="py-6 text-sm text-ink-soft">Loading conversation…</p>;
  if (!registered)
    return <p className="py-6 text-sm text-ink-soft">Register for this event to message the organizer.</p>;

  return (
    <div>
      <h3 className="font-display text-base font-bold text-ink">Message the organizer</h3>
      <p className="mb-3 text-sm text-ink-soft">Questions about the event? Send a note — they&apos;ll reply here.</p>
      <div className="h-[26rem] rounded-2xl bg-cream/50 p-4">
        <MessageThread
          initial={initial}
          myRole="attendee"
          onSend={(body) => postMessageToEvent(eventId, body)}
          emptyHint="No messages yet. Ask the organizer anything about the event."
        />
      </div>
    </div>
  );
}
