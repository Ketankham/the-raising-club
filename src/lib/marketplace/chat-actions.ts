"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type StartChatResult =
  | { ok: true; conversationId: string }
  | { ok: false; reason: "unauthenticated" | "invalid" | "error"; message?: string };

/** Find-or-create the 1:1 thread with another user (called from the marketplace
 *  Message buttons via /chat/new). Uses the get_or_create_direct_conversation
 *  RPC (SECURITY DEFINER) which dedupes the thread. */
export async function startDirectConversation(
  otherUserId: string,
  contextType?: string | null,
  contextId?: string | null,
): Promise<StartChatResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!otherUserId || otherUserId === user.id) return { ok: false, reason: "invalid" };

  const { data, error } = await supabase.rpc("get_or_create_direct_conversation", {
    other_user: otherUserId,
    ctx_type: contextType ?? null,
    ctx_id: contextId ?? null,
  });
  if (error || !data) return { ok: false, reason: "error", message: error?.message };
  return { ok: true, conversationId: data as string };
}

export type SendMessageResult = { ok: true } | { ok: false; reason: "unauthenticated" | "empty" | "error"; message?: string };

/** Post a message into a conversation (RLS: must be a participant + sender=self). */
export async function sendMessage(conversationId: string, body: string): Promise<SendMessageResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };
  if (!body.trim()) return { ok: false, reason: "empty" };
  if (body.length > 10000) return { ok: false, reason: "error", message: "Message is too long." };

  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_user_id: user.id, body: body.trim() });
  if (error) return { ok: false, reason: "error", message: error.message };

  // sender has implicitly "read" up to now
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);

  revalidatePath("/chat");
  return { ok: true };
}

/** Mark a conversation read for the current user (clears the unread badge). */
export async function markConversationRead(conversationId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false };
  await supabase
    .from("conversation_participants")
    .update({ last_read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("user_id", user.id);
  revalidatePath("/chat");
  return { ok: true };
}
