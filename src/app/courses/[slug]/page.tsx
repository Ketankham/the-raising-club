import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { getCourseForLearner } from "@/lib/courses/learner-queries";
import { CourseIntro } from "@/components/courses/course-intro";
import { CoursePlayer } from "@/components/courses/course-player";

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const course = await getCourseForLearner(slug);
  if (!course) notFound();

  // Enrolled learners get the player; everyone else sees the intro / enrol page.
  if (course.isEnrolled) {
    // If all modules are done, quiz exists, and cert not yet issued → send straight to quiz.
    if (course.hasQuiz && !course.certificate) {
      const allModuleIds = course.chapters.flatMap((ch) => ch.modules.map((m) => m.id));
      const completedSet = new Set(course.completedModuleIds);
      const allComplete = allModuleIds.length > 0 && allModuleIds.every((id) => completedSet.has(id));
      if (allComplete) redirect(`/courses/${slug}/quiz`);
    }

    return (
      <main className="min-h-screen bg-cream/30">
        <CoursePlayer course={course} />
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <CourseIntro course={course} signedIn={!!user} />
      </main>
      <SiteFooter />
    </>
  );
}
