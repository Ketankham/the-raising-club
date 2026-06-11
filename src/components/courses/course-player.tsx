"use client";

import { useMemo, useState, useTransition } from "react";
import DOMPurify from "isomorphic-dompurify";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Circle,
  PlayCircle,
  FileText,
  Award,
  Sparkles,
  PartyPopper,
} from "lucide-react";
import { VideoEmbed } from "./video-embed";
import { CancelPurchaseButton } from "./cancel-purchase-button";
import { completeModule, answerRevision } from "@/lib/courses/actions";
import { durationLabel } from "@/lib/courses/format";
import { RESOURCE_KIND_LABELS } from "@/lib/courses/types";
import type { LearnerCourse, LearnerModule, LearnerRevisionQuestion } from "@/lib/courses/learner-queries";

export function CoursePlayer({ course }: { course: LearnerCourse }) {
  const [pending, start] = useTransition();

  const allModules = useMemo(
    () => course.chapters.flatMap((ch) => ch.modules.map((m) => ({ ...m, chapterId: ch.id }))),
    [course.chapters],
  );

  const [completed, setCompleted] = useState<Set<string>>(new Set(course.completedModuleIds));
  const [answered, setAnswered] = useState<Set<string>>(new Set(course.answeredQuestionIds));
  const firstIncomplete = allModules.find((m) => !completed.has(m.id)) ?? allModules[0];
  const [currentId, setCurrentId] = useState<string>(firstIncomplete?.id ?? "");
  const [popup, setPopup] = useState<LearnerRevisionQuestion | null>(null);
  const [showCompletionPopup, setShowCompletionPopup] = useState(false);

  const current = allModules.find((m) => m.id === currentId) ?? allModules[0];
  const currentIndex = allModules.findIndex((m) => m.id === current?.id);
  const next = allModules[currentIndex + 1] ?? null;
  const allComplete = allModules.length > 0 && allModules.every((m) => completed.has(m.id));

  const advance = () => {
    if (next) setCurrentId(next.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isLastModuleCompletion = (m: LearnerModule, currentCompleted: Set<string>) => {
    const willBeAllComplete = allModules.every((mod) => mod.id === m.id || currentCompleted.has(mod.id));
    return willBeAllComplete && !course.hasQuiz;
  };

  const markCompleteAndContinue = (m: LearnerModule) => {
    // If there's an unanswered Pause & Notice, surface it first.
    if (m.revisionQuestion && !answered.has(m.revisionQuestion.id)) {
      setPopup(m.revisionQuestion);
      return;
    }
    start(async () => {
      await completeModule(course.id, course.slug, m.id);
      const next_completed = new Set(completed).add(m.id);
      setCompleted(next_completed);
      if (isLastModuleCompletion(m, completed)) {
        setShowCompletionPopup(true);
      } else {
        advance();
      }
    });
  };

  const onRevisionAnswered = (questionId: string) => {
    setAnswered((s) => new Set(s).add(questionId));
  };

  const closePopupAndContinue = () => {
    setPopup(null);
    if (!current) return;
    start(async () => {
      await completeModule(course.id, course.slug, current.id);
      const next_completed = new Set(completed).add(current.id);
      setCompleted(next_completed);
      if (isLastModuleCompletion(current, completed)) {
        setShowCompletionPopup(true);
      } else {
        advance();
      }
    });
  };

  const total = allModules.length;
  const done = allModules.filter((m) => completed.has(m.id)).length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  const isDone = current ? completed.has(current.id) : false;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 lg:px-6">
      <Link href="/courses" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
        <ArrowLeft size={16} /> Back to courses
      </Link>

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* MAIN ---------------------------------------------------------- */}
        <div className="min-w-0">
          {current && (
            <>
              {(current.videoUrl || course.introVideoUrl) && (
                <VideoEmbed
                  provider={current.videoProvider ?? course.introVideoProvider}
                  url={current.videoUrl ?? course.introVideoUrl}
                  title={current.title}
                />
              )}
              <h1 className="mt-5 font-display text-2xl font-bold text-ink">{current.title}</h1>
              {current.estMinutes ? (
                <p className="mt-1 text-sm text-ink-soft">{durationLabel(current.estMinutes)}</p>
              ) : null}

              {current.body && (
                <div
                  className="prose prose-sm mt-4 max-w-none text-ink"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(current.body) }}
                />
              )}

              {current.resources.length > 0 && (
                <div className="mt-6 rounded-2xl border border-ink/10 bg-cream/40 p-4">
                  <p className="mb-2 text-sm font-bold text-ink">Resources</p>
                  <ul className="space-y-2">
                    {current.resources.map((r) => (
                      <li key={r.id}>
                        <a
                          href={r.url ?? "#"}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
                        >
                          <FileText size={15} /> {r.label}
                          <span className="text-xs text-ink-soft">· {RESOURCE_KIND_LABELS[r.kind as keyof typeof RESOURCE_KIND_LABELS] ?? r.kind}</span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* primary action */}
              <div className="mt-8 flex flex-wrap items-center gap-3">
                {!isDone ? (
                  <button
                    onClick={() => markCompleteAndContinue(current)}
                    disabled={pending}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
                  >
                    {next ? "Mark complete & continue" : "Mark complete"} <ArrowRight size={16} />
                  </button>
                ) : next ? (
                  <button
                    onClick={advance}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    Continue <ArrowRight size={16} />
                  </button>
                ) : null}
              </div>
            </>
          )}

          {/* Completion / Integration Moment */}
          {allComplete && (
            <div className="mt-8 rounded-2xl border border-sage/40 bg-sage/20 p-5">
              {course.certificate ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="font-display text-lg font-bold text-ink">You&apos;ve completed this course 🎉</p>
                  <Link
                    href={`/courses/${course.slug}/certificate`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    <Award size={16} /> See your certificate
                  </Link>
                  <Link
                    href={`/courses/${course.slug}/quiz`}
                    className="text-sm text-ink-soft underline decoration-ink-soft/40 underline-offset-2 hover:text-ink"
                  >
                    Review your quiz answers
                  </Link>
                </div>
              ) : course.hasQuiz ? (
                <div className="flex flex-col items-start gap-3">
                  <p className="text-sm text-ink">You&apos;ve moved through every module. When you&apos;re ready, continue to the integration moment.</p>
                  <Link
                    href={`/courses/${course.slug}/quiz`}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90"
                  >
                    <Sparkles size={16} /> Go to Integration Moment
                  </Link>
                </div>
              ) : (
                <p className="font-display text-lg font-bold text-ink">You&apos;ve completed this course 🎉</p>
              )}
            </div>
          )}
        </div>

        {/* SIDEBAR (the path) -------------------------------------------- */}
        <aside className="lg:order-last">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 lg:sticky lg:top-20">
            <div className="mb-3">
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-ink">Your progress</span>
                <span className="text-ink-soft">{done}/{total}</span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-cream">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>

            {course.skipToCertEnabled && course.hasQuiz && !course.certificate && (
              <Link href={`/courses/${course.slug}/quiz`} className="mb-3 block text-xs text-ink-soft underline decoration-ink-soft/40 underline-offset-2 hover:text-ink">
                Already trained in Child Development? You can go straight to certification.
              </Link>
            )}

            <nav className="space-y-4">
              {course.chapters.map((ch) => (
                <div key={ch.id}>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft">{ch.title}</p>
                  <ul className="space-y-0.5">
                    {ch.modules.map((m) => {
                      const isComplete = completed.has(m.id);
                      const isCurrent = m.id === current?.id;
                      return (
                        <li key={m.id}>
                          <button
                            onClick={() => setCurrentId(m.id)}
                            className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                              isCurrent ? "bg-primary/10 font-semibold text-ink" : "text-ink-soft hover:bg-cream"
                            }`}
                          >
                            {isComplete ? (
                              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-primary" />
                            ) : isCurrent ? (
                              <PlayCircle size={16} className="mt-0.5 shrink-0 text-primary" />
                            ) : (
                              <Circle size={16} className="mt-0.5 shrink-0 text-ink-soft/40" />
                            )}
                            <span className="leading-snug">{m.title}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </nav>

            {course.purchaseCancelable && (
              <CancelPurchaseButton courseId={course.id} slug={course.slug} />
            )}
          </div>
        </aside>
      </div>

      {popup && (
        <PauseAndNotice
          question={popup}
          alreadyAnswered={answered.has(popup.id)}
          courseId={course.id}
          slug={course.slug}
          onAnswered={onRevisionAnswered}
          onContinue={closePopupAndContinue}
          onClose={() => setPopup(null)}
        />
      )}

      {showCompletionPopup && (
        <div className="fixed inset-0 z-50 grid place-items-center p-4">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setShowCompletionPopup(false)} />
          <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
            <div className="flex justify-center mb-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <PartyPopper size={32} className="text-primary" />
              </div>
            </div>
            <p className="font-display text-2xl font-bold text-ink">Congratulations! 🎉</p>
            <p className="mt-1 text-sm font-medium text-primary">{course.title}</p>
            <p className="mt-3 text-ink-soft">
              You&apos;ve completed every module in this course. Amazing work investing in your caregiving journey!
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <button
                onClick={() => setShowCompletionPopup(false)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
              >
                <Award size={16} /> Awesome, thanks!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// --- "Pause & Notice" popup -------------------------------------------------
function PauseAndNotice({
  question,
  alreadyAnswered,
  courseId,
  slug,
  onAnswered,
  onContinue,
  onClose,
}: {
  question: LearnerRevisionQuestion;
  alreadyAnswered: boolean;
  courseId: string;
  slug: string;
  onAnswered: (questionId: string) => void;
  onContinue: () => void;
  onClose: () => void;
}) {
  const [chosen, setChosen] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(alreadyAnswered);
  const [, start] = useTransition();

  const pick = (optionId: string) => {
    if (revealed) return;
    setChosen(optionId);
    setRevealed(true);
    onAnswered(question.id);
    start(async () => {
      await answerRevision(courseId, slug, question.id, optionId);
    });
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-ink/40" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        <p className="font-display text-xl font-bold text-ink">Pause &amp; Notice</p>
        <p className="mt-2 text-sm text-ink-soft">{question.prompt}</p>
        <p className="mt-3 text-xs font-medium text-ink-soft">What feels most true for you right now?</p>

        <div className="mt-3 space-y-2">
          {question.options.map((o) => {
            const isChosen = chosen === o.id;
            return (
              <button
                key={o.id}
                onClick={() => pick(o.id)}
                disabled={revealed}
                className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                  isChosen
                    ? "border-primary bg-primary/5"
                    : revealed && o.isRecommended
                      ? "border-olive/50 bg-olive/10"
                      : "border-ink/15 hover:border-ink/30"
                } ${revealed ? "cursor-default" : ""}`}
              >
                <span className="font-medium text-ink">{o.body}</span>
                {revealed && o.explanation && (
                  <span className="mt-1 block text-xs text-ink-soft">{o.explanation}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex justify-end">
          <button
            onClick={onContinue}
            disabled={!revealed}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
          >
            Continue <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
