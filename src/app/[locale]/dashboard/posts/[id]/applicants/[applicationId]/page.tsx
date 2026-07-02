import { ArrowLeft, MessageCircle, Star } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDetailedApplicant } from "@/lib/marketplace/jobs";
import { ApplicantActions } from "@/components/marketplace/applicant-actions";

export default async function ApplicantProfilePage({
  params,
}: {
  params: Promise<{ id: string; applicationId: string }>;
}) {
  const { id: jobId, applicationId } = await params;
  const applicant = await getDetailedApplicant(jobId, applicationId);

  if (!applicant) {
    redirect(`/dashboard/posts/${jobId}/applicants`);
  }

  const initials = applicant.firstName ? applicant.firstName[0].toUpperCase() : "C";
  const formattedDate = new Date(applicant.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const STATUS_LABEL: Record<string, string> = {
    applied: "Applied",
    reviewing: "Reviewing",
    shortlisted: "Shortlisted",
    hired: "Hired",
    rejected: "Declined",
    withdrawn: "Withdrawn",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href={`/dashboard/posts/${jobId}/applicants`}
          className="rounded-full hover:bg-cream p-2 transition"
        >
          <ArrowLeft className="h-5 w-5 text-ink" />
        </Link>
        <div>
          <p className="text-sm text-ink-soft">Application to</p>
          <h1 className="text-2xl font-bold text-ink">{applicant.jobTitle}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Profile */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile Card */}
          <div className="rounded-2xl border border-ink/10 bg-white p-6">
            <div className="flex items-start gap-4">
              {applicant.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={applicant.avatarUrl}
                  alt=""
                  className="h-24 w-24 rounded-2xl object-cover"
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-2xl bg-primary/15 text-3xl font-bold text-primary">
                  {initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <h2 className="text-2xl font-bold text-ink">{applicant.name}</h2>
                {applicant.headline && (
                  <p className="mt-1 text-base text-ink-soft">{applicant.headline}</p>
                )}
                {applicant.experienceLevel && (
                  <p className="mt-2 text-sm font-medium text-olive">
                    {applicant.experienceLevel} experience
                  </p>
                )}
                {applicant.ratingCount > 0 && (
                  <div className="mt-2 flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-ink">
                      {applicant.ratingAvg?.toFixed(1) || "0"} ({applicant.ratingCount} reviews)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* About Section */}
          {applicant.about && (
            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <h3 className="mb-3 font-semibold text-ink">About</h3>
              <p className="text-sm leading-relaxed text-ink-soft">{applicant.about}</p>
            </div>
          )}

          {/* Skills & Specialties */}
          {(applicant.skills.length > 0 || applicant.careSettings.length > 0 || applicant.ageGroups.length > 0) && (
            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <h3 className="mb-4 font-semibold text-ink">Expertise</h3>
              <div className="space-y-4">
                {applicant.skills.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-ink-soft uppercase">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {applicant.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-sage px-3 py-1 text-xs font-medium text-ink"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {applicant.ageGroups.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-ink-soft uppercase">Age Groups</p>
                    <div className="flex flex-wrap gap-2">
                      {applicant.ageGroups.map((age) => (
                        <span
                          key={age}
                          className="rounded-full bg-mint px-3 py-1 text-xs font-medium text-ink"
                        >
                          {age}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {applicant.careSettings.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-semibold text-ink-soft uppercase">Settings</p>
                    <div className="flex flex-wrap gap-2">
                      {applicant.careSettings.map((setting) => (
                        <span
                          key={setting}
                          className="rounded-full bg-peach px-3 py-1 text-xs font-medium text-ink"
                        >
                          {setting}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rate Information */}
          {applicant.rateAmount && (
            <div className="rounded-2xl border border-ink/10 bg-white p-6">
              <h3 className="mb-3 font-semibold text-ink">Rates</h3>
              <p className="text-lg font-bold text-olive">
                ${applicant.rateAmount}/{applicant.rateUnit || "hour"}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Application Status */}
          <div className="rounded-2xl border border-ink/10 bg-white p-6">
            <h3 className="mb-3 font-semibold text-ink">Application Status</h3>
            <div className="mb-4">
              <span className="rounded-full bg-mint px-3 py-1.5 text-sm font-medium text-ink">
                {STATUS_LABEL[applicant.status] ?? applicant.status}
              </span>
            </div>
            <p className="text-xs text-ink-soft">Applied on {formattedDate}</p>
          </div>

          {/* Application Details */}
          <div className="rounded-2xl border border-ink/10 bg-white p-6">
            <h3 className="mb-3 font-semibold text-ink">Application Details</h3>
            {applicant.proposedRate != null && (
              <div className="mb-3">
                <p className="text-xs text-ink-soft">Proposed Rate</p>
                <p className="font-semibold text-olive">${applicant.proposedRate}/hr</p>
              </div>
            )}
            {applicant.coverNote && (
              <div className="pt-3 border-t border-ink/10">
                <p className="text-xs text-ink-soft mb-2">Cover Note</p>
                <p className="text-sm leading-relaxed text-ink">{applicant.coverNote}</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <ApplicantActions
            applicationId={applicationId}
            jobId={jobId}
            status={applicant.status}
            caregiverIdVerified={applicant.caregiverIdVerified}
            caregiverUserId={applicant.caregiverUserId}
          />

          {/* Message Button */}
          <a
            href={`/chat/new?to=${applicant.caregiverUserId}&ctxType=application&ctxId=${applicationId}`}
            className="flex items-center justify-center gap-2 w-full rounded-full bg-olive px-4 py-3 font-semibold text-white transition hover:brightness-95"
          >
            <MessageCircle className="h-4 w-4" />
            Message Caregiver
          </a>

          {/* View Profile */}
          <a
            href={`/profile/${applicant.caregiverUserId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center w-full rounded-full border border-ink/15 px-4 py-3 font-semibold text-ink transition hover:bg-cream"
          >
            Full Profile →
          </a>
        </div>
      </div>
    </div>
  );
}
