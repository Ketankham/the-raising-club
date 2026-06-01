import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { getNotificationType } from "@/lib/notifications/queries";
import { NotificationTypeEditor } from "@/components/admin/notification-type-editor";

// Next 16: params is async — await it.
export default async function AdminNotificationTypePage({
  params,
}: {
  params: Promise<{ key: string }>;
}) {
  await requireAdmin();
  const { key } = await params;
  const type = await getNotificationType(decodeURIComponent(key));
  if (!type) notFound();
  return <NotificationTypeEditor type={type} />;
}
