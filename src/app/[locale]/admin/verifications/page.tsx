import { requireAdmin } from "@/lib/guards";
import { listVerifications } from "@/lib/admin";
import { VerificationsAdmin } from "@/components/admin/verifications-admin";

export default async function AdminVerificationsPage() {
  await requireAdmin();
  const verifications = await listVerifications();
  return <VerificationsAdmin rows={verifications} />;
}
