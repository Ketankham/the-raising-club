import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { getAdminUserDetail } from "@/lib/admin";
import { plansForRole } from "@/lib/plans/queries";
import { getUserPlanSummary } from "@/lib/plans/user-plans";
import { AdminUserDetailView } from "@/components/admin/admin-user-detail";
import { AdminUserPlans } from "@/components/admin/admin-user-plans";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const user = await getAdminUserDetail(id);
  if (!user) notFound();

  const [plans, planSummary] = await Promise.all([
    plansForRole(user.role ?? ""),
    getUserPlanSummary(id),
  ]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <AdminUserDetailView user={user} plans={plans} />
      {user.role !== "admin" && <AdminUserPlans userId={id} plans={plans} summary={planSummary} />}
    </div>
  );
}
