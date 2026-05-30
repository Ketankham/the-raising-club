import { createClient } from "@/lib/supabase/server";
import type { CourseVideoProvider } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface LearnerResource {
  id: string;
  label: string;
  kind: string;
  url: string | null;
  filePath: string | null;
}
export interface LearnerRevisionOption {
  id: string;
  body: string;
  explanation: string | null;
  isRecommended: boolean;
}
export interface LearnerRevisionQuestion {
  id: string;
  prompt: string;
  options: LearnerRevisionOption[];
}
export interface LearnerModule {
  id: string;
  title: string;
  body: string | null;
  videoProvider: CourseVideoProvider | null;
  videoUrl: string | null;
  estMinutes: number | null;
  resources: LearnerResource[];
  revisionQuestion: LearnerRevisionQuestion | null;
}
export interface LearnerChapter {
  id: string;
  title: string;
  summary: string | null;
  modules: LearnerModule[];
}
export interface LearnerCertificate {
  certificateId: string;
  verifyToken: string;
}
export interface LearnerCourse {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  summary: string | null;
  description: string | null;
  coverImageUrl: string | null;
  introVideoProvider: CourseVideoProvider | null;
  introVideoUrl: string | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  estimatedLearningMinutes: number | null;
  mode: string;
  skipToCertEnabled: boolean;
  skills: { id: string; label: string }[];
  chapters: LearnerChapter[];
  hasQuiz: boolean;
  isEnrolled: boolean;
  enrollmentStatus: "active" | "completed" | null;
  completedModuleIds: string[];
  answeredQuestionIds: string[];
  certificate: LearnerCertificate | null;
}

export async function getCourseForLearner(slug: string): Promise<LearnerCourse | null> {
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("courses")
    .select(
      `id, slug, title, subtitle, summary, description, cover_image_url, intro_video_provider,
       intro_video_url, age_min_months, age_max_months, estimated_learning_minutes, mode,
       skip_to_cert_enabled, status,
       course_skills ( skills ( id, label ) ),
       course_quizzes ( id ),
       course_chapters (
         id, title, summary, position,
         course_modules (
           id, title, body, video_provider, video_url, est_minutes, position,
           course_module_resources ( id, label, kind, url, file_path, position ),
           course_revision_questions (
             id, prompt, position,
             course_revision_options ( id, body, explanation, is_recommended, position )
           )
         )
       )`,
    )
    .eq("slug", slug)
    .maybeSingle();
  if (!c) return null;

  const { data: { user } } = await supabase.auth.getUser();

  let isEnrolled = false;
  let enrollmentStatus: "active" | "completed" | null = null;
  let completedModuleIds: string[] = [];
  let answeredQuestionIds: string[] = [];
  let certificate: LearnerCertificate | null = null;

  if (user) {
    const { data: enr } = await supabase
      .from("course_enrollments")
      .select("id, status")
      .eq("user_id", user.id)
      .eq("course_id", c.id)
      .maybeSingle();
    if (enr) {
      isEnrolled = true;
      enrollmentStatus = enr.status;
      const [{ data: prog }, { data: ans }, { data: cert }] = await Promise.all([
        supabase.from("course_module_progress").select("module_id").eq("enrollment_id", enr.id),
        supabase.from("course_revision_answers").select("question_id").eq("enrollment_id", enr.id),
        supabase.from("certificates").select("certificate_id, verify_token").eq("user_id", user.id).eq("course_id", c.id).maybeSingle(),
      ]);
      completedModuleIds = (prog ?? []).map((p: any) => p.module_id);
      answeredQuestionIds = (ans ?? []).map((a: any) => a.question_id);
      if (cert) certificate = { certificateId: cert.certificate_id, verifyToken: cert.verify_token };
    }
  }

  const chapters: LearnerChapter[] = (c.course_chapters ?? [])
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
    .map((ch: any) => ({
      id: ch.id,
      title: ch.title,
      summary: ch.summary,
      modules: (ch.course_modules ?? [])
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((m: any) => {
          const rq = (m.course_revision_questions ?? [])[0] ?? null;
          return {
            id: m.id,
            title: m.title,
            body: m.body,
            videoProvider: m.video_provider,
            videoUrl: m.video_url,
            estMinutes: m.est_minutes,
            resources: (m.course_module_resources ?? [])
              .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
              .map((r: any) => ({ id: r.id, label: r.label, kind: r.kind, url: r.url, filePath: r.file_path })),
            revisionQuestion: rq
              ? {
                  id: rq.id,
                  prompt: rq.prompt,
                  options: (rq.course_revision_options ?? [])
                    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                    .map((o: any) => ({ id: o.id, body: o.body, explanation: o.explanation, isRecommended: o.is_recommended })),
                }
              : null,
          };
        }),
    }));

  return {
    id: c.id,
    slug: c.slug,
    title: c.title,
    subtitle: c.subtitle,
    summary: c.summary,
    description: c.description,
    coverImageUrl: c.cover_image_url,
    introVideoProvider: c.intro_video_provider,
    introVideoUrl: c.intro_video_url,
    ageMinMonths: c.age_min_months,
    ageMaxMonths: c.age_max_months,
    estimatedLearningMinutes: c.estimated_learning_minutes,
    mode: c.mode ?? "Online · Self-paced",
    skipToCertEnabled: c.skip_to_cert_enabled,
    skills: (c.course_skills ?? []).map((s: any) => s.skills).filter(Boolean).map((s: any) => ({ id: s.id, label: s.label })),
    chapters,
    hasQuiz: (c.course_quizzes ?? []).length > 0,
    isEnrolled,
    enrollmentStatus,
    completedModuleIds,
    answeredQuestionIds,
    certificate,
  };
}

// ---------------------------------------------------------------------------
// My Courses dashboard
// ---------------------------------------------------------------------------
export interface MyCourseRow {
  slug: string;
  title: string;
  coverImageUrl: string | null;
  status: "active" | "completed";
  startedAt: string;
  completedAt: string | null;
  totalModules: number;
  completedModules: number;
  hasCertificate: boolean;
}

export async function getMyCourses(): Promise<MyCourseRow[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("course_enrollments")
    .select(
      `id, status, started_at, completed_at,
       courses ( id, slug, title, cover_image_url, course_modules ( id ) ),
       course_module_progress ( module_id )`,
    )
    .eq("user_id", user.id)
    .order("last_activity_at", { ascending: false });

  // certificates the user holds (by course)
  const { data: certs } = await supabase.from("certificates").select("course_id").eq("user_id", user.id);
  const certCourseIds = new Set((certs ?? []).map((c: any) => c.course_id));

  return (data ?? []).map((e: any): MyCourseRow => {
    const course = e.courses;
    return {
      slug: course?.slug ?? "",
      title: course?.title ?? "Course",
      coverImageUrl: course?.cover_image_url ?? null,
      status: e.status,
      startedAt: e.started_at,
      completedAt: e.completed_at,
      totalModules: (course?.course_modules ?? []).length,
      completedModules: (e.course_module_progress ?? []).length,
      hasCertificate: certCourseIds.has(course?.id),
    };
  });
}

// ---------------------------------------------------------------------------
// Quiz (server-side via SECURITY DEFINER RPCs)
// ---------------------------------------------------------------------------
export interface TakerQuiz {
  quizId: string;
  passThreshold: number;
  introCopy: string | null;
  questions: { id: string; prompt: string; options: { id: string; body: string }[] }[];
}

export async function getQuizForTaker(courseId: string): Promise<TakerQuiz | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("course_quiz_for_taker", { target_course: courseId });
  if (!data) return null;
  return {
    quizId: data.quiz_id,
    passThreshold: data.pass_threshold,
    introCopy: data.intro_copy,
    questions: (data.questions ?? []).map((q: any) => ({
      id: q.id,
      prompt: q.prompt,
      options: (q.options ?? []).map((o: any) => ({ id: o.id, body: o.body })),
    })),
  };
}

export interface QuizReviewQuestion {
  id: string;
  prompt: string;
  options: { id: string; body: string; isCorrect: boolean; explanation: string | null }[];
}

export async function getQuizReview(courseId: string): Promise<QuizReviewQuestion[] | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("course_quiz_review", { target_course: courseId });
  if (!data) return null;
  return (data as any[]).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: (q.options ?? []).map((o: any) => ({ id: o.id, body: o.body, isCorrect: o.is_correct, explanation: o.explanation })),
  }));
}

// ---------------------------------------------------------------------------
// Certificate (owner) + public verify
// ---------------------------------------------------------------------------
export interface CertificateView {
  certificateId: string;
  verifyToken: string;
  recipientName: string;
  courseTitle: string;
  courseSlug: string;
  mode: string | null;
  estimatedLearningMinutes: number | null;
  issuedAt: string;
  signer1Name: string | null;
  signer1Title: string | null;
  signer2Name: string | null;
  signer2Title: string | null;
  footerDisclaimer: string | null;
}

export async function getMyCertificate(slug: string): Promise<CertificateView | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("certificates")
    .select(`*, courses!inner ( slug )`)
    .eq("user_id", user.id)
    .eq("courses.slug", slug)
    .maybeSingle();
  if (!data) return null;
  return {
    certificateId: data.certificate_id,
    verifyToken: data.verify_token,
    recipientName: data.recipient_name,
    courseTitle: data.course_title,
    courseSlug: slug,
    mode: data.mode,
    estimatedLearningMinutes: data.estimated_learning_minutes,
    issuedAt: data.issued_at,
    signer1Name: data.signer1_name,
    signer1Title: data.signer1_title,
    signer2Name: data.signer2_name,
    signer2Title: data.signer2_title,
    footerDisclaimer: data.footer_disclaimer,
  };
}

export interface VerifyResult {
  valid: boolean;
  certificateId: string;
  recipientName: string;
  courseTitle: string;
  issuedAt: string;
  revokedAt: string | null;
}

export async function verifyCertificate(token: string): Promise<VerifyResult | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("verify_certificate", { token });
  if (!data) return null;
  return {
    valid: data.valid,
    certificateId: data.certificate_id,
    recipientName: data.recipient_name,
    courseTitle: data.course_title,
    issuedAt: data.issued_at,
    revokedAt: data.revoked_at,
  };
}
