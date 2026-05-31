import { createClient } from "@/lib/supabase/server";
import type { ChatThread, ConversationSummary } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

/** All of the current user's conversations (the Chat inbox), newest first.
 *  Peer identity + last message + unread come from marketplace_conversations(). */
export async function listMyConversations(): Promise<ConversationSummary[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("marketplace_conversations");
  if (error || !data) return [];
  return (data as any[]).map((r) => ({
    conversationId: r.conversationId,
    lastMessageAt: r.lastMessageAt,
    contextType: r.contextType ?? null,
    lastMessage: r.lastMessage ?? null,
    lastSenderId: r.lastSenderId ?? null,
    unreadCount: Number(r.unreadCount ?? 0),
    peers: r.peers ?? [],
  }));
}

/** One conversation thread (peers via definer fn; messages via RLS). Returns
 *  null if the caller isn't a participant. */
export async function getThread(conversationId: string): Promise<ChatThread | null> {
  const supabase = await createClient();
  const { data: peers, error: pErr } = await supabase.rpc("conversation_peers", { cid: conversationId });
  if (pErr || peers == null) return null; // not a participant / not found

  const { data: msgs } = await supabase
    .from("messages")
    .select("id, sender_user_id, body, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  return {
    conversationId,
    peers: (peers as any[]) ?? [],
    messages: (msgs ?? []).map((m: any) => ({
      id: m.id,
      senderId: m.sender_user_id,
      body: m.body,
      createdAt: m.created_at,
    })),
  };
}

/** The current user's id (so the thread can align bubbles). */
export async function getMyUserId(): Promise<string | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}
