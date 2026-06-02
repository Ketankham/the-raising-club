import { createClient } from "@/lib/supabase/server";
import type {
  NotificationCategory,
  NotificationType,
  TemplateVar,
  UserNotification,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function mapNotification(row: any): UserNotification {
  return {
    id: row.id,
    typeKey: row.type_key,
    category: row.category,
    title: row.title,
    body: row.body,
    link: row.link ?? null,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  };
}

function mapType(row: any): NotificationType {
  return {
    key: row.key,
    category: row.category,
    name: row.name,
    description: row.description ?? null,
    inappEnabled: !!row.inapp_enabled,
    emailEnabled: !!row.email_enabled,
    inappTitle: row.inapp_title ?? "",
    inappBody: row.inapp_body ?? "",
    emailSubject: row.email_subject ?? "",
    emailBody: row.email_body ?? "",
    ccAllAdmins: !!row.cc_all_admins,
    ccEmails: Array.isArray(row.cc_emails) ? (row.cc_emails as string[]) : [],
    availableVars: (row.available_vars ?? []) as TemplateVar[],
    sortOrder: row.sort_order ?? 0,
    updatedAt: row.updated_at,
  };
}

/** The current user's in-app feed (most recent 100) + unread count. */
export async function getMyNotifications(): Promise<{
  items: UserNotification[];
  unread: number;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { items: [], unread: 0 };

  const { data } = await supabase
    .from("notifications")
    .select("id, type_key, category, title, body, link, read_at, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const items = (data ?? []).map(mapNotification);
  const unread = items.filter((n) => !n.readAt).length;
  return { items, unread };
}

/** Just the unread count — cheap fetch for the bell badge. */
export async function getUnreadCount(): Promise<number> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .is("read_at", null);
  return count ?? 0;
}

/** Admin: the full notification-type catalog, category-grouped order. */
export async function listNotificationTypes(): Promise<NotificationType[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_types")
    .select("*")
    .order("category", { ascending: true })
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapType);
}

/** Admin: one notification type by key. */
export async function getNotificationType(key: string): Promise<NotificationType | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("notification_types")
    .select("*")
    .eq("key", key)
    .maybeSingle();
  return data ? mapType(data) : null;
}

export function groupByCategory(
  types: NotificationType[],
): Record<NotificationCategory, NotificationType[]> {
  const grouped: Record<NotificationCategory, NotificationType[]> = {
    courses: [],
    events: [],
    marketplace: [],
    general: [],
  };
  for (const t of types) grouped[t.category].push(t);
  return grouped;
}
