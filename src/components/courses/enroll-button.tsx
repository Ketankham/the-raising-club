"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { enrollInCourse } from "@/lib/courses/actions";

export function EnrollButton({
  courseId,
  slug,
  signedIn,
  label = "Enroll & start",
}: {
  courseId: string;
  slug: string;
  signedIn: boolean;
  label?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();

  const onClick = () =>
    start(async () => {
      if (!signedIn) {
        router.push(`/sign-in?next=${encodeURIComponent(`/courses/${slug}`)}`);
        return;
      }
      const res = await enrollInCourse(courseId, slug);
      if (res.ok) router.refresh();
      else if (res.reason === "unauthenticated") router.push(`/sign-in?next=${encodeURIComponent(`/courses/${slug}`)}`);
    });

  return (
    <button
      onClick={onClick}
      disabled={pending}
      className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:opacity-60"
    >
      {pending ? "Starting…" : label} <ArrowRight size={16} />
    </button>
  );
}
