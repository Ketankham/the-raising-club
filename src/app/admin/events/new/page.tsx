import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireEventManager } from "@/lib/guards";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app/app-header";
import { EventForm } from "@/components/events/admin/event-form";

export default async function NewEventPage() {
  const { isAdmin, orgIds, profile } = await requireEventManager();

  let orgs: { id: string; name: string }[] = [];
  if (!isAdmin && orgIds.length) {
    const supabase = await createClient();
    const { data } = await supabase.from("organizations").select("id, name").in("id", orgIds);
    orgs = data ?? [];
  }

  return (
    <>
      <AppHeader name={profile.preferred_name || profile.first_name || undefined} />
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Link href="/admin/events" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Back to events
        </Link>
        <h1 className="mb-6 font-display text-2xl font-bold text-ink">Create event</h1>
        <EventForm initial={null} orgs={orgs} isAdmin={isAdmin} />
      </main>
    </>
  );
}
