import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Briefcase, DollarSign, MapPin, Users } from "lucide-react";
import { requireAdmin } from "@/lib/guards";
import { getJobById, getJobApplicants } from "@/lib/marketplace/jobs";
import { ApplicantRow } from "@/components/marketplace/applicant-row";
import { moneyRange } from "@/lib/marketplace/format";

export default async function AdminJobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin();
  const { id } = await params;

  const [job, data] = await Promise.all([getJobById(id), getJobApplicants(id)]);
  if (!job || !data) notFound();

  const pay = moneyRange(job.payMin, job.payMax, job.payUnit);

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/admin/marketplace" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
        <ArrowLeft className="h-4 w-4" /> Marketplace
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-ink">{data.title}</h1>
          <div className="mt-1.5 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
            {job.locationLabel && <span className="flex items-center gap-1"><MapPin size={14} /> {job.locationLabel}</span>}
            {pay && <span className="flex items-center gap-1"><DollarSign size={14} /> {pay}</span>}
            {job.scheduleLabel && <span className="flex items-center gap-1"><Briefcase size={14} /> {job.scheduleLabel}</span>}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/admin/marketplace/${id}/edit`}
            className="rounded-full border border-ink/20 px-4 py-2 text-sm font-semibold text-ink-soft hover:text-ink"
          >
            Edit
          </Link>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div className="mb-6 rounded-2xl border border-ink/5 bg-white p-5 shadow-sm">
          <h2 className="mb-2 font-display text-base font-semibold text-ink">Description</h2>
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-soft">{job.description}</p>
        </div>
      )}

      {/* Applicants */}
      <div className="mb-3 flex items-center gap-3">
        <h2 className="font-display text-lg font-bold text-ink">Applicants</h2>
        <span className="flex items-center gap-1 rounded-full bg-lavender px-2.5 py-0.5 text-xs font-semibold text-ink">
          <Users size={12} /> {data.applicants.length}
        </span>
      </div>

      {data.applicants.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink/15 bg-white/50 p-10 text-center">
          <p className="font-display text-lg font-bold text-ink">No applicants yet</p>
          <p className="mt-1 text-sm text-ink-soft">Caregivers who apply will appear here.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.applicants.map((a) => (
            <ApplicantRow key={a.applicationId} a={a} />
          ))}
        </div>
      )}
    </div>
  );
}
