import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, MapPin, DollarSign, Clock, Users, CalendarDays } from "lucide-react";
import { requireOnboardedForMarketplace } from "@/lib/guards";
import { getJobById } from "@/lib/marketplace/jobs";
import { JobApplyPanel } from "@/components/marketplace/job-apply-panel";
import { moneyRange, SCHEDULE_LABELS, AGE_GROUP_TAGS, CARE_TYPE_LABELS, type CareType } from "@/lib/marketplace/format";

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { profile } = await requireOnboardedForMarketplace();
  const { id } = await params;
  const job = await getJobById(id);
  if (!job) notFound();

  const pay = moneyRange(job.payMin, job.payMax, job.payUnit);
  const canApply = profile.role === "caregiver";

  return (
    <div className="max-w-3xl">
      <Link href="/jobs" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Find Jobs
      </Link>

      <div className="rounded-3xl bg-mint/50 p-6 sm:p-8">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl font-bold text-ink sm:text-3xl">{job.title}</h1>
          {job.isCoHire && <span className="rounded-full bg-sage/60 px-2.5 py-0.5 text-xs font-medium text-ink">Co-hire</span>}
        </div>

        <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
          {pay && <span className="flex items-center gap-1.5 font-semibold text-olive"><DollarSign className="h-4 w-4" />{pay}</span>}
          {job.locationLabel && <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" />{job.locationLabel}</span>}
          {job.hoursPerWeek != null && <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" />{job.hoursPerWeek} hrs/week</span>}
          {job.openings > 1 && <span className="flex items-center gap-1.5"><Users className="h-4 w-4" />{job.openings} openings</span>}
          {job.scheduleLabel && <span className="flex items-center gap-1.5"><CalendarDays className="h-4 w-4" />{job.scheduleLabel}</span>}
        </div>

        <JobApplyPanel jobId={job.id} jobTitle={job.title} canApply={canApply} applicationStatus={job.myApplicationStatus ?? null} />
      </div>

      {job.description && (
        <section className="mt-6">
          <h2 className="font-display text-lg font-bold text-ink">About this job</h2>
          <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{job.description}</p>
        </section>
      )}

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {job.careType && (
          <Box title="Care type"><Chips items={[CARE_TYPE_LABELS[job.careType as CareType]]} /></Box>
        )}
        {job.ages.length > 0 && <Box title="Ages"><Chips items={job.ages.map((a) => AGE_GROUP_TAGS[a] ?? a)} /></Box>}
        {job.schedule.length > 0 && <Box title="Schedule"><Chips items={job.schedule.map((s) => SCHEDULE_LABELS[s] ?? s)} /></Box>}
        {job.skills.length > 0 && <Box title="Desired skills"><Chips items={job.skills} /></Box>}
      </div>
    </div>
  );
}

function Box({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-soft">{title}</h3>
      {children}
    </div>
  );
}
function Chips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((t) => (
        <span key={t} className="rounded-full border border-ink/15 bg-cream/60 px-2.5 py-0.5 text-xs text-ink-soft">{t}</span>
      ))}
    </div>
  );
}
