import { requireAdmin } from "@/lib/guards";
import { listAllPlansForAdmin } from "@/lib/plans/admin-queries";
import { PlansAdmin } from "@/components/admin/plans-admin";

export default async function AdminPlansPage() {
  await requireAdmin();
  const plans = await listAllPlansForAdmin();
  return <PlansAdmin plans={plans} />;
}
