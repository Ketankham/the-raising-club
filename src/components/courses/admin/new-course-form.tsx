"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { createCourse } from "@/lib/courses/admin-actions";

export function NewCourseForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    start(async () => {
      setErr(null);
      const res = await createCourse(title.trim());
      if (res.ok) router.push(`/admin/courses/${res.id}/edit`);
      else setErr(res.message ?? `Could not create (${res.reason}).`);
    });
  };

  return (
    <form onSubmit={submit} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-ink">Course title</span>
        <input
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Foundations of Infant & Toddler Caregiving"
          className="w-full rounded-xl border border-ink/15 bg-white px-3 py-2.5 text-sm text-ink placeholder:text-ink-soft/60 focus:border-primary focus:outline-none"
        />
      </label>
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <button
        type="submit"
        disabled={pending || !title.trim()}
        className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? "Creating…" : "Create & continue"} <ArrowRight size={16} />
      </button>
      <p className="mt-3 text-xs text-ink-soft">
        We&apos;ll create a draft and take you to the editor to build chapters, modules, the quiz, and the certificate.
      </p>
    </form>
  );
}
