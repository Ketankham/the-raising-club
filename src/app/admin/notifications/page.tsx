import { requireAdmin } from "@/lib/guards";
import { listNotificationTypes } from "@/lib/notifications/queries";
import { NotificationsAdmin } from "@/components/admin/notifications-admin";

export default async function AdminNotificationsPage() {
  await requireAdmin();
  const types = await listNotificationTypes();
  return <NotificationsAdmin types={types} />;
}
