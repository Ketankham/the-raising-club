import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireEventManager } from "@/lib/guards";
import { getEventForEdit } from "@/lib/events/admin";
import { getEventThreads } from "@/lib/events/messages-actions";
import { MessageInbox } from "@/components/events/admin/message-inbox";

export default async function EventMessagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireEventManager();
  const { id } = await params;

  const ev = await getEventForEdit(id);
  if (!ev) notFound();
  const threads = await getEventThreads(id);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href={`/admin/events/${id}/roster`}
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
      >
        <ArrowLeft size={16} /> Back to roster
      </Link>
      <h1 className="font-display text-2xl font-bold text-ink">{ev.title}</h1>
      <p className="mb-6 text-sm text-ink-soft">Messages</p>
      <MessageInbox threads={threads} />
    </div>
  );
}
