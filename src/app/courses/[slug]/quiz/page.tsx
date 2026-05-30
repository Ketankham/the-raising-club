import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getCourseForLearner, getQuizForTaker } from "@/lib/courses/learner-queries";
import { QuizRunner } from "@/components/courses/quiz-runner";

export default async function QuizPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseForLearner(slug);
  if (!course) notFound();
  if (!course.isEnrolled) redirect(`/courses/${slug}`);
  if (course.certificate) redirect(`/courses/${slug}/certificate`);

  const quiz = await getQuizForTaker(course.id);
  if (!quiz || quiz.questions.length === 0) redirect(`/courses/${slug}`);

  return (
    <main className="min-h-screen bg-cream/30">
      <div className="mx-auto max-w-2xl px-5 pt-8">
        <Link href={`/courses/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Back to course
        </Link>
      </div>
      <QuizRunner courseId={course.id} slug={slug} quiz={quiz} />
    </main>
  );
}
