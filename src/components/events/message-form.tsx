"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { sendOrganizerMessage } from "@/lib/events/actions";

/** "Send a Message" — the Message/Connect tab on a registered event. */
export function MessageForm({ eventId }: { eventId: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();

  if (sent) {
    return (
      <div className="rounded-2xl bg-[#eef6e3] p-5 text-sm text-ink">
        Thanks! Your message has been sent to the event organizer.
      </div>
    );
  }

  return (
    <div>
      <h3 className="font-display text-base font-bold text-ink">Send a Message</h3>
      <p className="mt-1 text-sm text-ink-soft">
        Have questions? Send a message to the event organizer.
      </p>
      <form
        className="mt-4 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const res = await sendOrganizerMessage(eventId, subject, body);
            if (res.ok) setSent(true);
            else if (res.reason === "unauthenticated") router.push("/sign-in");
          });
        }}
      >
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            required
            placeholder="What's your question about?"
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-[#9cc766]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-semibold text-ink">Message</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            rows={4}
            placeholder="Type your message here..."
            className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-sm text-ink outline-none focus:border-[#9cc766]"
          />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-[#9cc766] py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#8bb957] disabled:opacity-60"
        >
          {pending ? "Sending…" : "Send Message"}
        </button>
      </form>
    </div>
  );
}
