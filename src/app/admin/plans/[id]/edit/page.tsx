import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/guards";
import { getPlanForAdmin } from "@/lib/plans/admin-queries";
import { PlanEditor } from "@/components/admin/plan-editor";

export default async function EditPlanPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const plan = await getPlanForAdmin(id);
  if (!plan) notFound();
  return <PlanEditor plan={plan} />;
}
