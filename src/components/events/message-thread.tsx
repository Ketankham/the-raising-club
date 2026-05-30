"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import type { ThreadMessage } from "@/lib/events/message-types";
import type { PostResult } from "@/lib/events/messages-actions";

function timeLabel(iso: string) {
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

/** Reusable chat thread: bubbles aligned by sender + a composer. */
export function MessageThread({
  initial,
  myRole,
  onSend,
  emptyHint = "No messages yet. Say hello!",
}: {
  initial: ThreadMessage[];
  myRole: "attendee" | "organizer";
  onSend: (body: string) => Promise<PostResult>;
  emptyHint?: string;
}) {
  const [messages, setMessages] = useState<ThreadMessage[]>(initial);
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // NB: callers that switch threads pass a `key` so this remounts with fresh
  // `initial` (avoids syncing state in an effect).
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [messages.length]);

  async function send() {
    const body = text.trim();
    if (!body || pending) return;
    setPending(true);
    setErr(null);
    const res = await onSend(body);
    setPending(false);
    if (res.ok) {
      setMessages((m) => [...m, res.message]);
      setText("");
    } else {
      setErr("Couldn't send. Please try again.");
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
        {messages.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-soft">{emptyHint}</p>
        ) : (
          messages.map((m) => {
            const mine = m.senderRole === myRole;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-[#9cc766] text-white" : "bg-white text-ink shadow-sm"}`}>
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className={`mt-1 text-[0.65rem] ${mine ? "text-white/70" : "text-ink-soft"}`}>
                    {timeLabel(m.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      {err && <p className="mt-2 text-xs text-red-600">{err}</p>}
      <div className="mt-3 flex items-end gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          rows={2}
          placeholder="Type your message…"
          className="flex-1 resize-none rounded-xl border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-[#9cc766]"
        />
        <button
          type="button"
          onClick={send}
          disabled={pending || !text.trim()}
          aria-label="Send"
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#9cc766] text-white transition hover:bg-[#8bb957] disabled:opacity-50"
        >
          <Send size={17} />
        </button>
      </div>
    </div>
  );
}
