// Hand-typed interfaces for the notification system. DB types are not generated
// (see CLAUDE.md), so rows from `notifications` / `notification_types` are mapped
// into these by queries.ts.

export type NotificationCategory = "courses" | "events" | "marketplace" | "general";

export const CATEGORY_ORDER: NotificationCategory[] = [
  "courses",
  "events",
  "marketplace",
  "general",
];

export const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  courses: "Courses",
  events: "Events",
  marketplace: "Marketplace",
  general: "General",
};

/** A {{token}} a template may use, with a human label for the admin editor. */
export interface TemplateVar {
  token: string;
  label: string;
}

/** A row from the admin-managed catalog. */
export interface NotificationType {
  key: string;
  category: NotificationCategory;
  name: string;
  description: string | null;
  inappEnabled: boolean;
  emailEnabled: boolean;
  inappTitle: string;
  inappBody: string;
  emailSubject: string;
  emailBody: string;
  ccAdmin: boolean;
  availableVars: TemplateVar[];
  sortOrder: number;
  updatedAt: string;
}

/** A delivered in-app notification for the current user. */
export interface UserNotification {
  id: string;
  typeKey: string;
  category: NotificationCategory;
  title: string;
  body: string;
  link: string | null;
  readAt: string | null;
  createdAt: string;
}
