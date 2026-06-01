import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { getAdminUserDetail } from "@/lib/admin";
import { plansForRole } from "@/lib/membership/plans";
import { AdminUserDetailView } from "@/components/admin/admin-user-detail";

export default async function AdminUserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const user = await getAdminUserDetail(id);
  if (!user) notFound();

  return <AdminUserDetailView user={user} plans={plansForRole(user.role ?? "")} />;
}
