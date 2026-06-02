import { BookOpen, Clock, Users, GraduationCap, Check } from "lucide-react";
import { VideoEmbed } from "./video-embed";
import { EnrollButton } from "./enroll-button";
import { ageRangeLabel, durationLabel } from "@/lib/courses/format";
import type { LearnerCourse } from "@/lib/courses/learner-queries";

/** Detail A — the pre-enrolment course page. */
export function CourseIntro({ course, signedIn }: { course: LearnerCourse; signedIn: boolean }) {
  const totalModules = course.chapters.reduce((n, ch) => n + ch.modules.length, 0);
  const duration = durationLabel(course.estimatedLearningMinutes);

  return (
    <section className="mx-auto max-w-5xl px-5 py-10 lg:px-8 lg:py-14">
      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="min-w-0">
          {course.introVideoUrl ? (
            <VideoEmbed provider={course.introVideoProvider} url={course.introVideoUrl} title={course.title} />
          ) : course.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={course.coverImageUrl} alt={course.title} className="aspect-[16/9] w-full rounded-2xl object-cover" />
          ) : null}

          <h1 className="mt-6 font-display text-3xl font-bold text-ink lg:text-4xl">{course.title}</h1>
          {course.subtitle && <p className="mt-2 text-lg text-ink-soft">{course.subtitle}</p>}
          {course.description && <p className="mt-4 whitespace-pre-line text-ink-soft">{course.description}</p>}

          {course.skills.length > 0 && (
            <div className="mt-8">
              <h2 className="font-display text-lg font-bold text-ink">Skills you&apos;ll earn</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {course.skills.map((s) => (
                  <span key={s.id} className="inline-flex items-center gap-1.5 rounded-full bg-olive/15 px-3 py-1.5 text-sm font-medium text-ink">
                    <Check size={14} className="text-olive" /> {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8">
            <h2 className="font-display text-lg font-bold text-ink">What&apos;s inside</h2>
            <ol className="mt-3 space-y-2">
              {course.chapters.map((ch, i) => (
                <li key={ch.id} className="rounded-xl border border-ink/10 bg-white p-4">
                  <p className="font-semibold text-ink">
                    <span className="text-ink-soft">{i + 1}.</span> {ch.title}
                  </p>
                  <p className="mt-0.5 text-sm text-ink-soft">
                    {ch.modules.length} module{ch.modules.length === 1 ? "" : "s"}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Sidebar enrol card */}
        <aside>
          <div className="rounded-2xl border border-ink/10 bg-white p-5 shadow-sm lg:sticky lg:top-20">
            <p className="font-display text-2xl font-bold text-ink">
              {course.isFree || !course.priceCents ? "Free" : `$${Math.round(course.priceCents / 100)}`}
            </p>
            <ul className="mt-4 space-y-2.5 text-sm text-ink-soft">
              <li className="flex items-center gap-2"><BookOpen size={16} className="text-ink-soft/70" /> {totalModules} module{totalModules === 1 ? "" : "s"}</li>
              {duration && <li className="flex items-center gap-2"><Clock size={16} className="text-ink-soft/70" /> {duration}</li>}
              {(course.ageMinMonths != null || course.ageMaxMonths != null) && (
                <li className="flex items-center gap-2"><Users size={16} className="text-ink-soft/70" /> {ageRangeLabel(course.ageMinMonths, course.ageMaxMonths)}</li>
              )}
              <li className="flex items-center gap-2"><GraduationCap size={16} className="text-ink-soft/70" /> {course.mode}</li>
            </ul>
            <div className="mt-5">
              <EnrollButton courseId={course.id} slug={course.slug} signedIn={signedIn} isFree={course.isFree} priceCents={course.priceCents} />
            </div>
            {!course.isFree && course.priceCents > 0 && (
              <p className="mt-3 text-center text-xs text-ink-soft">
                Cancel within 48 hours of purchase for a full refund.
              </p>
            )}
            {course.hasQuiz && (
              <p className="mt-3 text-center text-xs text-ink-soft">Earn a certificate on completion.</p>
            )}
          </div>
        </aside>
      </div>
    </section>
  );
}
