"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Award, Sparkles, PartyPopper } from "lucide-react";
import { submitQuiz } from "@/lib/courses/actions";
import type { TakerQuiz } from "@/lib/courses/learner-queries";

export function QuizRunner({
  courseId,
  slug,
  quiz,
  courseTitle,
}: {
  courseId: string;
  slug: string;
  quiz: TakerQuiz;
  courseTitle?: string;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [notYet, setNotYet] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);

  const allAnswered = quiz.questions.every((q) => answers[q.id]);

  const submit = () =>
    start(async () => {
      setError(null);
      setNotYet(false);
      const res = await submitQuiz(courseId, slug, answers);
      if (!res.ok) {
        setError(res.message ?? "Something went wrong. Please try again.");
        return;
      }
      if (res.data?.passed) {
        setShowCongrats(true);
      } else {
        setNotYet(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

  return (
    <>
    {showCongrats && (
      <div className="fixed inset-0 z-50 grid place-items-center p-4">
        <div className="absolute inset-0 bg-ink/50" />
        <div className="relative w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl text-center">
          <div className="flex justify-center mb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
              <PartyPopper size={32} className="text-primary" />
            </div>
          </div>
          <p className="font-display text-2xl font-bold text-ink">Congratulations! 🎉</p>
          {courseTitle && (
            <p className="mt-1 text-sm font-medium text-primary">{courseTitle}</p>
          )}
          <p className="mt-3 text-ink-soft">
            You&apos;ve completed the Integration Moment and earned your certificate. Well done on investing in your growth as a caregiver!
          </p>
          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={() => router.push(`/courses/${slug}/certificate`)}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary/90"
            >
              <Award size={16} /> View your certificate
            </button>
            <button
              onClick={() => router.push("/courses/my")}
              className="text-sm text-ink-soft hover:text-ink"
            >
              Go to My Courses
            </button>
          </div>
        </div>
      </div>
    )}
    <div className="mx-auto max-w-2xl px-5 py-10">
      <div className="mb-6">
        <p className="flex items-center gap-2 font-display text-2xl font-bold text-ink">
          <Sparkles size={20} className="text-primary" /> Integration Moment
        </p>
        {quiz.introCopy && <p className="mt-2 text-ink-soft">{quiz.introCopy}</p>}
        <p className="mt-1 text-sm text-ink-soft">Select the option that best applies.</p>
      </div>

      {notYet && (
        <div className="mb-6 rounded-2xl border border-yellow/50 bg-yellow/15 p-4">
          <p className="text-sm text-ink">
            Take a gentle moment with the material, then try again when you&apos;re ready — there&apos;s no rush, and you can
            attempt this as many times as you like.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {quiz.questions.map((q, i) => (
          <fieldset key={q.id} className="rounded-2xl border border-ink/10 bg-white p-5">
            <legend className="px-1 font-semibold text-ink">
              {i + 1}. {q.prompt}
            </legend>
            <div className="mt-3 space-y-2">
              {q.options.map((o) => {
                const checked = answers[q.id] === o.id;
                return (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 text-sm transition ${
                      checked ? "border-primary bg-primary/5 text-ink" : "border-ink/15 text-ink-soft hover:border-ink/30"
                    }`}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      checked={checked}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: o.id }))}
                      className="accent-primary"
                    />
                    <span className="font-medium">{o.body}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <button
          onClick={submit}
          disabled={pending || !allAnswered}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-50"
        >
          {pending ? "Checking…" : "Continue"} <ArrowRight size={16} />
        </button>
      </div>
    </div>
    </>
  );
}
