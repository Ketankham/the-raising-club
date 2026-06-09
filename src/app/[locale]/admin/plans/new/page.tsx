import { requireAdmin } from "@/lib/guards";
import { PlanEditor } from "@/components/admin/plan-editor";

export default async function NewPlanPage() {
  await requireAdmin();
  return <PlanEditor />;
}
