"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/guards";
import { getMyNotifications } from "./queries";
import type { UserNotification } from "./types";

type Result = { ok: true } | { ok: false; error: string };

/** Load the caller's feed — called by the bell when the panel opens. */
export async function getFeed(): Promise<{ items: UserNotification[]; unread: number }> {
  return getMyNotifications();
}

/**
 * Mark the caller's notifications read. Pass specific ids, or omit to mark all.
 * RLS + the mark_notifications_read() RPC guarantee a user only touches their own.
 */
export async function markRead(ids?: string[]): Promise<Result> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("mark_notifications_read", {
    p_ids: ids && ids.length > 0 ? ids : null,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function markAllRead(): Promise<Result> {
  return markRead();
}

/* ----------------------------- Admin actions ----------------------------- */

/** Flip a single channel on a notification type. */
export async function toggleChannel(
  key: string,
  channel: "inapp" | "email",
  enabled: boolean,
): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const column = channel === "inapp" ? "inapp_enabled" : "email_enabled";
  const { error } = await supabase
    .from("notification_types")
    .update({ [column]: enabled })
    .eq("key", key);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/notifications");
  return { ok: true };
}

/** Update the editable fields of a notification type (bodies, toggles, cc). */
export async function updateNotificationType(
  key: string,
  input: {
    inappEnabled: boolean;
    emailEnabled: boolean;
    ccAdmin: boolean;
    inappTitle: string;
    inappBody: string;
    emailSubject: string;
    emailBody: string;
  },
): Promise<Result> {
  await requireAdmin();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notification_types")
    .update({
      inapp_enabled: input.inappEnabled,
      email_enabled: input.emailEnabled,
      cc_admin: input.ccAdmin,
      inapp_title: input.inappTitle,
      inapp_body: input.inappBody,
      email_subject: input.emailSubject,
      email_body: input.emailBody,
    })
    .eq("key", key);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/notifications");
  revalidatePath(`/admin/notifications/${key}`);
  return { ok: true };
}
