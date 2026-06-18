import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { createClient } from "@/lib/supabase/server";
import { getCourseForLearner, getTeamCourseProgress } from "@/lib/courses/learner-queries";
import { CourseIntro } from "@/components/courses/course-intro";
import { CoursePlayer } from "@/components/courses/course-player";
import { TeamLearningTab } from "@/components/courses/team-learning-tab";

export default async function CoursePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { slug } = await params;
  const sp = await searchParams;
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

    const activeTab = sp.tab === "team" ? "team" : "learn";
    const teamMembers = activeTab === "team" ? await getTeamCourseProgress(course.id) : [];

    return (
      <main className="min-h-screen bg-cream/30">
        <CoursePlayer course={course} activeTab={activeTab} teamMembers={teamMembers} />
      </main>
    );
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <div className="mx-auto max-w-5xl px-5 py-5 lg:px-8">
          <Link href="/courses" className="inline-flex items-center gap-1.5 text-sm font-medium text-ink-soft hover:text-ink">
            <ArrowLeft className="h-4 w-4" /> Browse Courses
          </Link>
        </div>
        <CourseIntro course={course} signedIn={!!user} />
      </main>
      <SiteFooter />
    </>
  );
}
