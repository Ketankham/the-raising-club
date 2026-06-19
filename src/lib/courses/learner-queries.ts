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
  isFree: boolean;
  priceCents: number;
  skills: { id: string; label: string }[];
  chapters: LearnerChapter[];
  hasQuiz: boolean;
  isEnrolled: boolean;
  enrollmentStatus: "active" | "completed" | null;
  completedModuleIds: string[];
  answeredQuestionIds: string[];
  certificate: LearnerCertificate | null;
  /** Paid purchase still inside the 48h cancellation window. */
  purchaseCancelable: boolean;
  /** The user previously bought this course and cancelled (access revoked). */
  purchaseWasCancelled: boolean;
}

export async function getCourseForLearner(slug: string): Promise<LearnerCourse | null> {
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("courses")
    .select(
      `id, slug, title, subtitle, summary, description, cover_image_url, intro_video_provider,
       intro_video_url, age_min_months, age_max_months, estimated_learning_minutes, mode,
       skip_to_cert_enabled, status, is_free, price_cents,
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
  let purchaseCancelable = false;
  let purchaseWasCancelled = false;

  if (user) {
    const { data: enr } = await supabase
      .from("course_enrollments")
      .select("id, status, paid_at, created_at, stripe_payment_intent_id")
      .eq("user_id", user.id)
      .eq("course_id", c.id)
      .maybeSingle();
    if (enr && (enr as any).status === "cancelled") {
      // Cancelled purchase: access revoked — treat as not enrolled.
      purchaseWasCancelled = true;
    } else if (enr) {
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

      // Paid + within the 48h window => self-cancel allowed.
      if ((enr as any).stripe_payment_intent_id) {
        const purchasedAt = (enr as any).paid_at ?? (enr as any).created_at;
        purchaseCancelable =
          !purchasedAt || Date.now() < +new Date(purchasedAt) + 48 * 3600 * 1000;
      }
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
    isFree: c.is_free ?? true,
    priceCents: c.price_cents ?? 0,
    skills: (c.course_skills ?? []).map((s: any) => s.skills).filter(Boolean).map((s: any) => ({ id: s.id, label: s.label })),
    chapters,
    hasQuiz: (c.course_quizzes ?? []).length > 0,
    isEnrolled,
    enrollmentStatus,
    completedModuleIds,
    answeredQuestionIds,
    certificate,
    purchaseCancelable,
    purchaseWasCancelled,
  };
}

// ---------------------------------------------------------------------------
// My Courses dashboard
// ---------------------------------------------------------------------------
export interface MyCourseRow {
  slug: string;
  title: string;
  coverImageUrl: string | null;
  status: "active" | "completed" | "cancelled";
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
  options: { id: string; body: string; isCorrect: boolean; explanation: string | null; userChosen: boolean }[];
}

export async function getQuizReview(courseId: string): Promise<QuizReviewQuestion[] | null> {
  const supabase = await createClient();
  const { data } = await supabase.rpc("course_quiz_review", { target_course: courseId });
  if (!data) return null;

  // Fetch the user's answers from their last passed attempt for this course.
  let userAnswers: Record<string, string> = {};
  const { data: enrollment } = await supabase
    .from("course_enrollments")
    .select("id")
    .eq("course_id", courseId)
    .maybeSingle();
  if (enrollment) {
    const { data: attempt } = await supabase
      .from("course_quiz_attempts")
      .select("answers")
      .eq("enrollment_id", enrollment.id)
      .eq("passed", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    userAnswers = (attempt?.answers as Record<string, string>) ?? {};
  }

  return (data as any[]).map((q) => ({
    id: q.id,
    prompt: q.prompt,
    options: (q.options ?? []).map((o: any) => ({
      id: o.id,
      body: o.body,
      isCorrect: o.is_correct,
      explanation: o.explanation,
      userChosen: userAnswers[q.id] === o.id,
    })),
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

// ---------------------------------------------------------------------------
// Team Learning — org-wide progress for a course
// ---------------------------------------------------------------------------
export interface TeamMemberProgress {
  userId: string;
  name: string;
  avatarUrl: string | null;
  enrollmentStatus: "active" | "completed" | null;
  completedModules: number;
  totalModules: number;
  hasCertificate: boolean;
}

/**
 * Returns course progress for all active members of the caller's organizations
 * who are enrolled in the given course. Returns [] if the caller is not an org
 * member or no peers are enrolled.
 */
export async function getTeamCourseProgress(courseId: string): Promise<TeamMemberProgress[]> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  // Find the caller's orgs.
  const { data: myMemberships } = await supabase
    .from("organization_members")
    .select("org_id")
    .eq("user_id", user.id)
    .eq("status", "active");

  if (!myMemberships?.length) return [];
  const orgIds = myMemberships.map((m: any) => m.org_id);

  // All active peers (including self) in those orgs.
  const { data: peers } = await supabase
    .from("organization_members")
    .select("user_id")
    .in("org_id", orgIds)
    .eq("status", "active");

  if (!peers?.length) return [];
  const peerIds = [...new Set((peers as any[]).map((p) => p.user_id as string))];

  // Enrollments for those peers on this course.
  const { data: enrollments } = await supabase
    .from("course_enrollments")
    .select("id, user_id, status, course_module_progress ( module_id )")
    .in("user_id", peerIds)
    .eq("course_id", courseId)
    .neq("status", "cancelled");

  if (!enrollments?.length) return [];
  const enrolledUserIds = (enrollments as any[]).map((e) => e.user_id as string);

  // Profile info for those enrolled peers.
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, first_name, preferred_name, avatar_url")
    .in("id", enrolledUserIds);

  // Total module count for this course.
  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, course_chapters!inner ( course_id )")
    .eq("course_chapters.course_id", courseId);
  const totalModules = modules?.length ?? 0;

  // Certificates held by these users for this course.
  const { data: certs } = await supabase
    .from("certificates")
    .select("user_id")
    .eq("course_id", courseId)
    .in("user_id", enrolledUserIds);
  const certUserIds = new Set((certs ?? []).map((c: any) => c.user_id as string));

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  return (enrollments as any[]).map((e) => {
    const p = profileMap.get(e.user_id) ?? {};
    return {
      userId: e.user_id,
      name: (p.preferred_name || p.first_name) ?? "Team member",
      avatarUrl: p.avatar_url ?? null,
      enrollmentStatus: e.status,
      completedModules: (e.course_module_progress ?? []).length,
      totalModules,
      hasCertificate: certUserIds.has(e.user_id),
    };
  });
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
