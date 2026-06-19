import { Users, Award, CheckCircle2, Circle } from "lucide-react";
import type { TeamMemberProgress } from "@/lib/courses/learner-queries";

function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="mt-1 flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
        <div className="h-full rounded-full bg-olive transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-ink-soft">{pct}%</span>
    </div>
  );
}

export function TeamLearningTab({ members }: { members: TeamMemberProgress[] }) {
  if (members.length === 0) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center">
        <Users className="mx-auto h-10 w-10 text-ink-soft/30" />
        <p className="mt-3 font-display text-base font-semibold text-ink">No team members enrolled yet</p>
        <p className="mt-1 text-sm text-ink-soft">
          When other members of your organization enroll in this course, their progress will appear here.
        </p>
      </div>
    );
  }

  const completed = members.filter((m) => m.enrollmentStatus === "completed").length;
  const certified = members.filter((m) => m.hasCertificate).length;

  return (
    <div className="space-y-5">
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Enrolled" value={members.length} />
        <StatCard label="Completed" value={completed} highlight />
        <StatCard label="Certified" value={certified} highlight={certified > 0} />
      </div>

      {/* Member list */}
      <div className="overflow-hidden rounded-2xl bg-white divide-y divide-ink/5">
        {members.map((m) => (
          <div key={m.userId} className="flex items-center gap-4 px-5 py-4">
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-ink/10">
              {m.avatarUrl ? (
                <img src={m.avatarUrl} alt={m.name} className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-ink-soft">
                  {m.name.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-ink truncate">{m.name}</span>
                {m.hasCertificate && (
                  <span title="Certificate earned" className="inline-flex shrink-0">
                    <Award className="h-3.5 w-3.5 text-[#e09c40]" aria-label="Certificate earned" />
                  </span>
                )}
              </div>
              {m.totalModules > 0 ? (
                <ProgressBar value={m.completedModules} max={m.totalModules} />
              ) : (
                <p className="mt-0.5 text-xs text-ink-soft">No modules yet</p>
              )}
            </div>

            <div className="shrink-0">
              {m.enrollmentStatus === "completed" ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[#dcebc6] px-2.5 py-1 text-xs font-semibold text-[#4f6b15]">
                  <CheckCircle2 className="h-3 w-3" /> Done
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs text-ink-soft">
                  <Circle className="h-3 w-3" /> In progress
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className="rounded-xl bg-white p-4 text-center">
      <p className={`text-2xl font-bold ${highlight && value > 0 ? "text-olive" : "text-ink"}`}>{value}</p>
      <p className="text-xs text-ink-soft">{label}</p>
    </div>
  );
}
