import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { getPlanForAdmin } from "@/lib/plans/admin-queries";
import { listSubscribers } from "@/lib/plans/subscribers";
import { SubscribersTable } from "@/components/admin/subscribers-table";

export default async function PlanSubscribersPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;
  const plan = await getPlanForAdmin(id);
  if (!plan) notFound();
  const subscribers = await listSubscribers({ planId: id });

  return (
    <div className="max-w-3xl">
      <Link href="/admin/plans" className="mb-4 inline-flex items-center gap-1 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> All plans
      </Link>
      <h1 className="mb-1 text-xl font-semibold text-ink">{plan.name} · subscribers</h1>
      <p className="mb-6 text-sm text-ink-soft">Accounts and households currently active on this plan.</p>
      <SubscribersTable rows={subscribers} />
    </div>
  );
}
