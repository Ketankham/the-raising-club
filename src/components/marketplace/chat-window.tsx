"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Send, MessageCircle, ArrowLeft } from "lucide-react";
import { sendMessage, markConversationRead } from "@/lib/marketplace/chat-actions";
import type { ChatThread, ConversationSummary } from "@/lib/marketplace/types";

function timeLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  return sameDay
    ? d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function Avatar({ name, url, size = 40 }: { name: string; url: string | null; size?: number }) {
  return url ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" style={{ width: size, height: size }} className="rounded-full object-cover" />
  ) : (
    <span style={{ width: size, height: size }} className="grid place-items-center rounded-full bg-primary/15 text-sm font-bold text-primary">
      {name[0]?.toUpperCase()}
    </span>
  );
}

/** The marketplace Chat window: all conversations on the left, the open thread
 *  on the right. New threads are started from the marketplace (Message buttons),
 *  not from here. */
export function ChatWindow({
  conversations,
  thread,
  selectedId,
  myUserId,
}: {
  conversations: ConversationSummary[];
  thread: ChatThread | null;
  selectedId: string | null;
  myUserId: string;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [pending, start] = useTransition();
  const scrollRef = useRef<HTMLDivElement>(null);

  const peerName = (c: ConversationSummary) => c.peers.map((p) => p.name).join(", ") || "Conversation";
  const threadPeerName = thread?.peers.map((p) => p.name).join(", ") || "Conversation";

  // mark the open thread read
  useEffect(() => {
    if (selectedId) markConversationRead(selectedId);
  }, [selectedId, thread?.messages.length]);

  // scroll to newest
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [thread?.messages.length, selectedId]);

  function send() {
    if (!draft.trim() || !selectedId) return;
    const body = draft;
    setDraft("");
    start(async () => {
      const res = await sendMessage(selectedId, body);
      if (res.ok) router.refresh();
      else setDraft(body);
    });
  }

  return (
    <div className="flex h-[calc(100vh-9rem)] overflow-hidden rounded-2xl border border-ink/10 bg-white">
      {/* conversation list */}
      <aside className={`w-full shrink-0 overflow-y-auto border-r border-ink/10 sm:w-80 ${selectedId ? "hidden sm:block" : "block"}`}>
        <div className="border-b border-ink/5 px-4 py-3">
          <h1 className="font-display text-lg font-bold text-ink">Messages</h1>
        </div>
        {conversations.length === 0 ? (
          <div className="p-6 text-center text-sm text-ink-soft">
            No conversations yet. Start one from a caregiver or family profile in the marketplace.
          </div>
        ) : (
          conversations.map((c) => {
            const peer = c.peers[0];
            const active = c.conversationId === selectedId;
            return (
              <Link
                key={c.conversationId}
                href={`/chat?c=${c.conversationId}`}
                className={`flex items-center gap-3 px-4 py-3 transition ${active ? "bg-mint/60" : "hover:bg-cream"}`}
              >
                <Avatar name={peerName(c)} url={peer?.avatarUrl ?? null} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold text-ink">{peerName(c)}</span>
                    <span className="shrink-0 text-xs text-ink-soft">{timeLabel(c.lastMessageAt)}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm text-ink-soft">
                      {c.lastSenderId === myUserId && "You: "}
                      {c.lastMessage ?? "New conversation"}
                    </span>
                    {c.unreadCount > 0 && (
                      <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-primary px-1 text-xs font-bold text-white">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </aside>

      {/* thread */}
      <section className={`min-w-0 flex-1 flex-col ${selectedId ? "flex" : "hidden sm:flex"}`}>
        {!thread ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 text-ink-soft">
            <MessageCircle className="h-8 w-8 opacity-40" />
            <p className="text-sm">Select a conversation</p>
          </div>
        ) : (
          <>
            <header className="flex items-center gap-3 border-b border-ink/5 px-4 py-3">
              <Link href="/chat" className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-cream sm:hidden">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <Avatar name={threadPeerName} url={thread.peers[0]?.avatarUrl ?? null} size={36} />
              <div>
                <p className="font-semibold text-ink">{threadPeerName}</p>
                {thread.peers[0]?.role && <p className="text-xs capitalize text-ink-soft">{thread.peers[0].role}</p>}
              </div>
            </header>

            <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto bg-cream/40 px-4 py-4">
              {thread.messages.length === 0 ? (
                <p className="py-10 text-center text-sm text-ink-soft">Say hello 👋</p>
              ) : (
                thread.messages.map((m) => {
                  const mine = m.senderId === myUserId;
                  return (
                    <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? "bg-olive text-white" : "bg-white text-ink shadow-sm"}`}>
                        <p className="whitespace-pre-wrap">{m.body}</p>
                        <p className={`mt-1 text-[0.65rem] ${mine ? "text-white/70" : "text-ink-soft"}`}>{timeLabel(m.createdAt)}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex items-end gap-2 border-t border-ink/5 px-4 py-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={1}
                placeholder="Write a message…"
                className="max-h-32 flex-1 resize-none rounded-2xl border border-ink/15 bg-white px-3.5 py-2.5 text-sm text-ink outline-none focus:border-olive"
              />
              <button
                onClick={send}
                disabled={pending || !draft.trim()}
                aria-label="Send"
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-olive text-white transition hover:brightness-95 disabled:opacity-40"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
