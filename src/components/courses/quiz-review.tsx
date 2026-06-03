import Link from "next/link";
import { ArrowLeft, Award, CheckCircle2, XCircle } from "lucide-react";
import type { QuizReviewQuestion } from "@/lib/courses/learner-queries";

export function QuizReview({
  questions,
  slug,
  courseTitle,
}: {
  questions: QuizReviewQuestion[];
  slug: string;
  courseTitle: string;
}) {
  const totalQ = questions.length;
  const correctCount = questions.filter((q) => q.options.some((o) => o.userChosen && o.isCorrect)).length;
  const pct = totalQ ? Math.round((correctCount / totalQ) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-2">
        <Link
          href={`/courses/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          <ArrowLeft size={16} /> Back to course
        </Link>
      </div>

      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{courseTitle}</p>
          <h1 className="mt-1 font-display text-2xl font-bold text-ink">Your Integration Moment review</h1>
          <p className="mt-1 text-sm text-ink-soft">
            You scored <span className="font-semibold text-ink">{correctCount}/{totalQ}</span> ({pct}%) on your passing attempt.
          </p>
        </div>
        <Link
          href={`/courses/${slug}/certificate`}
          className="shrink-0 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/20"
        >
          <Award size={15} /> See certificate
        </Link>
      </div>

      <div className="space-y-6">
        {questions.map((q, i) => {
          const chosen = q.options.find((o) => o.userChosen);
          const correct = q.options.find((o) => o.isCorrect);
          const wasRight = chosen?.isCorrect ?? false;

          return (
            <div key={q.id} className="rounded-2xl border border-ink/10 bg-white p-5">
              <div className="flex items-start gap-3">
                {wasRight ? (
                  <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-olive" />
                ) : (
                  <XCircle size={20} className="mt-0.5 shrink-0 text-red-400" />
                )}
                <p className="font-semibold text-ink">
                  {i + 1}. {q.prompt}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {q.options.map((o) => {
                  const isChosen = o.userChosen;
                  const isCorrect = o.isCorrect;

                  let style = "border-ink/10 bg-cream/30 text-ink-soft";
                  if (isCorrect && isChosen) style = "border-olive/60 bg-olive/10 text-ink";
                  else if (isCorrect && !isChosen) style = "border-olive/40 bg-olive/5 text-ink";
                  else if (isChosen && !isCorrect) style = "border-red-300 bg-red-50 text-ink";

                  return (
                    <div key={o.id} className={`rounded-xl border p-3 text-sm ${style}`}>
                      <div className="flex items-center gap-2">
                        {isCorrect ? (
                          <CheckCircle2 size={15} className="shrink-0 text-olive" />
                        ) : isChosen ? (
                          <XCircle size={15} className="shrink-0 text-red-400" />
                        ) : (
                          <span className="h-[15px] w-[15px] shrink-0" />
                        )}
                        <span className="font-medium">{o.body}</span>
                        {isChosen && !isCorrect && (
                          <span className="ml-auto shrink-0 text-xs text-red-500">Your answer</span>
                        )}
                        {isChosen && isCorrect && (
                          <span className="ml-auto shrink-0 text-xs text-olive">Your answer ✓</span>
                        )}
                        {!isChosen && isCorrect && (
                          <span className="ml-auto shrink-0 text-xs text-olive">Correct answer</span>
                        )}
                      </div>
                      {o.explanation && (
                        <p className="mt-2 ml-[23px] text-xs text-ink-soft">{o.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>

              {chosen && !wasRight && correct && (
                <p className="mt-3 ml-1 text-xs text-ink-soft">
                  The correct answer was: <span className="font-medium text-ink">{correct.body}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href={`/courses/${slug}/certificate`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
        >
          <Award size={16} /> View your certificate
        </Link>
        <Link
          href={`/courses/${slug}`}
          className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          Back to course
        </Link>
      </div>
    </div>
  );
}
