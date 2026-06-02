"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { enrollInCourse, startCourseCheckout } from "@/lib/courses/actions";

export function EnrollButton({
  courseId,
  slug,
  signedIn,
  isFree = true,
  priceCents = 0,
  label = "Enroll & start",
}: {
  courseId: string;
  slug: string;
  signedIn: boolean;
  isFree?: boolean;
  priceCents?: number;
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const paid = !isFree && priceCents > 0;

  const onClick = () =>
    start(async () => {
      if (!signedIn) {
        router.push(`/sign-in?next=${encodeURIComponent(`/courses/${slug}`)}`);
        return;
      }
      setError(null);
      if (paid) {
        const res = await startCourseCheckout(courseId, slug);
        if (res.ok) window.location.href = res.url;
        else if (res.reason === "unauthenticated") router.push(`/sign-in?next=${encodeURIComponent(`/courses/${slug}`)}`);
        else if (res.reason === "already_enrolled" || res.reason === "free") router.refresh();
        else setError(res.message ?? "Could not start checkout.");
        return;
      }
      const res = await enrollInCourse(courseId, slug);
      if (res.ok) router.refresh();
      else if (res.reason === "unauthenticated") router.push(`/sign-in?next=${encodeURIComponent(`/courses/${slug}`)}`);
      else setError(res.message ?? "Could not enroll.");
    });

  return (
    <div>
      <button
        onClick={onClick}
        disabled={pending}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
      >
        {pending ? (paid ? "Redirecting…" : "Starting…") : paid ? `Buy & enroll` : label} <ArrowRight size={16} />
      </button>
      {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
    </div>
  );
}
