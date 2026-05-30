import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireEventManager } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/events/admin/event-form";
import { getEventForEdit } from "@/lib/events/admin";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { isAdmin, orgIds } = await requireEventManager();
  const { id } = await params;

  const initial = await getEventForEdit(id);
  if (!initial) notFound();

  let orgs: { id: string; name: string }[] = [];
  if (!isAdmin && orgIds.length) {
    const supabase = await createClient();
    const { data } = await supabase.from("organizations").select("id, name").in("id", orgIds);
    orgs = data ?? [];
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/events" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Back to events
      </Link>
      <h1 className="mb-6 font-display text-2xl font-bold text-ink">Edit event</h1>
      <EventForm initial={initial} orgs={orgs} isAdmin={isAdmin} />
    </div>
  );
}
