"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Sparkles } from "lucide-react";
import { submitQuiz } from "@/lib/courses/actions";
import type { TakerQuiz } from "@/lib/courses/learner-queries";

export function QuizRunner({
  courseId,
  slug,
  quiz,
}: {
  courseId: string;
  slug: string;
  quiz: TakerQuiz;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [notYet, setNotYet] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        router.push(`/courses/${slug}/certificate`);
      } else {
        setNotYet(true);
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    });

  return (
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
  );
}
