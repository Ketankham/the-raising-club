"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight, CheckCircle2, Circle, PlayCircle, FileText, Sparkles, Eye, Pencil, BadgeCheck,
} from "lucide-react";
import { VideoEmbed } from "./video-embed";
import { durationLabel } from "@/lib/courses/format";
import { RESOURCE_KIND_LABELS } from "@/lib/courses/types";
import type { CourseEditorInput, ModuleInput, RevisionQuestionInput, QuizInput } from "@/lib/courses/types";

const QUIZ_KEY = "__quiz__";

/**
 * Admin-only, read-only walkthrough of a course exactly as a learner would
 * experience it — modules, "Pause & Notice" revision questions, and the final
 * quiz — built from the admin editor data (getCourseForEdit). Nothing is written:
 * no enrollment, no progress, no quiz attempts. Lives under /admin so it's gated
 * to admins by the route guard.
 */
export function CoursePreview({ course }: { course: CourseEditorInput }) {
  const allModules = useMemo(
    () => course.chapters.flatMap((ch) => ch.modules.map((m) => ({ ...m, chapterId: ch.id }))),
    [course.chapters],
  );
  const hasQuiz = !!course.quiz && course.quiz.questions.length > 0;

  const [currentId, setCurrentId] = useState<string>(allModules[0]?.id ?? (hasQuiz ? QUIZ_KEY : ""));
  const onQuiz = currentId === QUIZ_KEY;
  const current = allModules.find((m) => m.id === currentId) ?? null;
  const idx = allModules.findIndex((m) => m.id === current?.id);
  const next = allModules[idx + 1] ?? null;

  const goNext = () => {
    if (next) setCurrentId(next.id);
    else if (hasQuiz) setCurrentId(QUIZ_KEY);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 lg:px-6">
      {/* ADMIN PREVIEW BANNER */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-300/60 bg-amber-50 px-5 py-3">
        <div className="flex items-center gap-2 text-sm text-amber-900">
          <Eye size={16} />
          <span className="font-semibold">Admin preview</span>
          <span className="text-amber-900/70">— how this course looks to a learner. Only admins can see this; nothing is saved.</span>
          <span className="ml-1 rounded-full bg-white/70 px-2 py-0.5 text-xs font-semibold uppercase text-amber-900">{course.status}</span>
        </div>
        <Link
          href={`/admin/courses/${course.id}/edit`}
          className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-sm font-semibold text-ink shadow-sm hover:brightness-95"
        >
          <Pencil size={14} /> Back to editor
        </Link>
      </div>

      <h1 className="mb-1 font-display text-2xl font-bold text-ink">{course.title || "Untitled course"}</h1>
      {course.subtitle && <p className="mb-5 text-ink-soft">{course.subtitle}</p>}

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* MAIN ---------------------------------------------------------- */}
        <div className="min-w-0">
          {onQuiz && course.quiz ? (
            <QuizPreview quiz={course.quiz} />
          ) : current ? (
            <ModuleView
              module={current}
              introVideoProvider={course.introVideoProvider}
              introVideoUrl={course.introVideoUrl}
              isLast={!next}
              hasQuiz={hasQuiz}
              onContinue={goNext}
            />
          ) : (
            <p className="text-ink-soft">This course has no modules yet.</p>
          )}
        </div>

        {/* SIDEBAR (the path) -------------------------------------------- */}
        <aside className="lg:order-last">
          <div className="rounded-2xl border border-ink/10 bg-white p-4 lg:sticky lg:top-20">
            <p className="mb-3 text-sm font-bold text-ink">Course path</p>
            <nav className="space-y-4">
              {course.chapters.map((ch) => (
                <div key={ch.id}>
                  <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink-soft">{ch.title || "Untitled chapter"}</p>
                  <ul className="space-y-0.5">
                    {ch.modules.map((m) => {
                      const isCurrent = m.id === current?.id && !onQuiz;
                      return (
                        <li key={m.id}>
                          <button
                            onClick={() => setCurrentId(m.id)}
                            className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                              isCurrent ? "bg-primary/10 font-semibold text-ink" : "text-ink-soft hover:bg-cream"
                            }`}
                          >
                            {isCurrent ? (
                              <PlayCircle size={16} className="mt-0.5 shrink-0 text-primary" />
                            ) : (
                              <Circle size={16} className="mt-0.5 shrink-0 text-ink-soft/40" />
                            )}
                            <span className="leading-snug">{m.title || "Untitled module"}</span>
                            {m.revisionQuestion && (
                              <span className="ml-auto mt-0.5 shrink-0 text-[0.6rem] font-semibold uppercase text-olive">Q</span>
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}

              {hasQuiz && (
                <button
                  onClick={() => setCurrentId(QUIZ_KEY)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition ${
                    onQuiz ? "bg-primary/10 font-semibold text-ink" : "text-ink-soft hover:bg-cream"
                  }`}
                >
                  <Sparkles size={16} className="shrink-0 text-primary" /> Integration Moment (Quiz)
                </button>
              )}
            </nav>
          </div>
        </aside>
      </div>
    </div>
  );
}

// --- A single module view ---------------------------------------------------
function ModuleView({
  module: m, introVideoProvider, introVideoUrl, isLast, hasQuiz, onContinue,
}: {
  module: ModuleInput;
  introVideoProvider: CourseEditorInput["introVideoProvider"];
  introVideoUrl: string;
  isLast: boolean;
  hasQuiz: boolean;
  onContinue: () => void;
}) {
  return (
    <>
      {(m.videoUrl || introVideoUrl) && (
        <VideoEmbed provider={m.videoProvider ?? introVideoProvider} url={m.videoUrl || introVideoUrl} title={m.title} />
      )}
      <h2 className="mt-5 font-display text-2xl font-bold text-ink">{m.title || "Untitled module"}</h2>
      {m.estMinutes ? <p className="mt-1 text-sm text-ink-soft">{durationLabel(m.estMinutes)}</p> : null}

      {m.body && <div className="prose prose-sm mt-4 max-w-none text-ink" dangerouslySetInnerHTML={{ __html: m.body }} />}

      {m.resources.length > 0 && (
        <div className="mt-6 rounded-2xl border border-ink/10 bg-cream/40 p-4">
          <p className="mb-2 text-sm font-bold text-ink">Resources</p>
          <ul className="space-y-2">
            {m.resources.map((r) => (
              <li key={r.id}>
                <a href={r.url || "#"} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                  <FileText size={15} /> {r.label || "Resource"}
                  <span className="text-xs text-ink-soft">· {RESOURCE_KIND_LABELS[r.kind] ?? r.kind}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      {m.revisionQuestion && <RevisionPreview question={m.revisionQuestion} />}

      <div className="mt-8">
        {!isLast ? (
          <button onClick={onContinue} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
            Continue <ArrowRight size={16} />
          </button>
        ) : hasQuiz ? (
          <button onClick={onContinue} className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90">
            Go to Integration Moment <Sparkles size={16} />
          </button>
        ) : (
          <p className="font-display text-lg font-bold text-ink">End of course 🎉</p>
        )}
      </div>
    </>
  );
}

// --- "Pause & Notice" revision question (local reveal) ----------------------
function RevisionPreview({ question }: { question: RevisionQuestionInput }) {
  const [revealed, setRevealed] = useState(false);
  const [chosen, setChosen] = useState<string | null>(null);

  return (
    <div className="mt-6 rounded-2xl border border-olive/40 bg-olive/10 p-5">
      <p className="font-display text-base font-bold text-ink">Pause &amp; Notice</p>
      <p className="mt-1.5 text-sm text-ink-soft">{question.prompt}</p>
      <div className="mt-3 space-y-2">
        {question.options.map((o) => {
          const isChosen = chosen === o.id;
          return (
            <button
              key={o.id}
              onClick={() => { setChosen(o.id); setRevealed(true); }}
              className={`w-full rounded-xl border p-3 text-left text-sm transition ${
                isChosen ? "border-primary bg-primary/5"
                  : revealed && o.isRecommended ? "border-olive/60 bg-olive/15"
                  : "border-ink/15 bg-white hover:border-ink/30"
              }`}
            >
              <span className="flex items-center gap-2 font-medium text-ink">
                {revealed && o.isRecommended && <BadgeCheck size={15} className="text-olive" />}
                {o.body}
              </span>
              {revealed && o.explanation && <span className="mt-1 block text-xs text-ink-soft">{o.explanation}</span>}
            </button>
          );
        })}
      </div>
      {!revealed && <p className="mt-2 text-xs text-ink-soft">Select an option to preview the response shown to learners.</p>}
    </div>
  );
}

// --- Quiz preview (answer key) ----------------------------------------------
function QuizPreview({ quiz }: { quiz: QuizInput }) {
  return (
    <div>
      <div className="flex items-center gap-2">
        <Sparkles size={18} className="text-primary" />
        <h2 className="font-display text-2xl font-bold text-ink">Integration Moment</h2>
      </div>
      <p className="mt-1 text-sm text-ink-soft">
        Pass mark: {quiz.passThreshold}% · {quiz.questions.length} question{quiz.questions.length === 1 ? "" : "s"}
        <span className="ml-2 rounded-full bg-olive/15 px-2 py-0.5 text-xs font-semibold text-[#4f6b15]">Answer key — admin only</span>
      </p>
      {quiz.introCopy && <p className="mt-3 text-sm text-ink">{quiz.introCopy}</p>}

      <ol className="mt-6 space-y-6">
        {quiz.questions.map((q, i) => (
          <li key={q.id} className="rounded-2xl border border-ink/10 bg-white p-5">
            <p className="font-display font-bold text-ink">{i + 1}. {q.prompt}</p>
            <ul className="mt-3 space-y-2">
              {q.options.map((o) => (
                <li
                  key={o.id}
                  className={`rounded-xl border p-3 text-sm ${o.isCorrect ? "border-olive/60 bg-olive/10" : "border-ink/12 bg-cream/30"}`}
                >
                  <span className="flex items-center gap-2 font-medium text-ink">
                    {o.isCorrect ? <CheckCircle2 size={15} className="text-olive" /> : <Circle size={15} className="text-ink-soft/40" />}
                    {o.body}
                    {o.isCorrect && <span className="ml-1 rounded-full bg-olive/20 px-2 py-0.5 text-[0.65rem] font-bold uppercase text-[#4f6b15]">Correct</span>}
                  </span>
                  {o.explanation && <span className="mt-1 block pl-7 text-xs text-ink-soft">{o.explanation}</span>}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
