import { createClient } from "@/lib/supabase/server";
import type {
  CourseEditorInput,
  CourseTaxonomy,
  BundleInput,
} from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface ManagedCourseRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  isFeatured: boolean;
  chapterCount: number;
  moduleCount: number;
  enrollmentCount: number;
}

/** Courses the current admin manages (admins see all). */
export async function listManagedCourses(): Promise<ManagedCourseRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select(
      `id, slug, title, status, is_featured,
       course_chapters ( id ),
       course_modules ( id ),
       course_enrollments ( id )`,
    )
    .order("created_at", { ascending: false });

  return (data ?? []).map((c: any): ManagedCourseRow => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    status: c.status,
    isFeatured: c.is_featured,
    chapterCount: (c.course_chapters ?? []).length,
    moduleCount: (c.course_modules ?? []).length,
    enrollmentCount: (c.course_enrollments ?? []).length,
  }));
}

export async function getCourseTaxonomy(): Promise<CourseTaxonomy> {
  const supabase = await createClient();
  const [cats, apps, skills] = await Promise.all([
    supabase.from("course_categories").select("id, label").order("position"),
    supabase.from("course_approaches").select("id, label").order("position"),
    supabase.from("skills").select("id, label, is_specialized").order("label"),
  ]);
  return {
    categories: (cats.data ?? []).map((r: any) => ({ id: r.id, label: r.label })),
    approaches: (apps.data ?? []).map((r: any) => ({ id: r.id, label: r.label })),
    skills: (skills.data ?? []).map((r: any) => ({
      id: r.id,
      label: r.label,
      isSpecialized: r.is_specialized,
    })),
  };
}

/** Loads a full course tree into the editor's input shape. */
export async function getCourseForEdit(id: string): Promise<CourseEditorInput | null> {
  const supabase = await createClient();
  const { data: c } = await supabase
    .from("courses")
    .select(
      `*,
       course_skills ( skill_id ),
       course_certificate_config ( * ),
       course_chapters (
         id, title, summary, position,
         course_modules (
           id, chapter_id, title, body, video_provider, video_url, est_minutes, position,
           course_module_resources ( id, label, kind, url, file_path, position ),
           course_revision_questions (
             id, prompt, position,
             course_revision_options ( id, body, explanation, is_recommended, position )
           )
         )
       ),
       course_quizzes (
         id, intro_copy, pass_threshold,
         course_quiz_questions (
           id, prompt, position,
           course_quiz_options ( id, body, explanation, is_correct, position )
         )
       )`,
    )
    .eq("id", id)
    .maybeSingle();
  if (!c) return null;

  const cfg = (c.course_certificate_config ?? [])[0] ?? {};
  const quizRow = (c.course_quizzes ?? [])[0] ?? null;

  const chapters = (c.course_chapters ?? [])
    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
    .map((ch: any) => ({
      id: ch.id,
      title: ch.title ?? "",
      summary: ch.summary ?? "",
      position: ch.position ?? 0,
      modules: (ch.course_modules ?? [])
        .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
        .map((m: any) => {
          const rq = (m.course_revision_questions ?? [])[0] ?? null;
          return {
            id: m.id,
            title: m.title ?? "",
            body: m.body ?? "",
            videoProvider: m.video_provider ?? null,
            videoUrl: m.video_url ?? "",
            estMinutes: m.est_minutes ?? null,
            position: m.position ?? 0,
            resources: (m.course_module_resources ?? [])
              .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
              .map((r: any) => ({
                id: r.id,
                label: r.label ?? "",
                kind: r.kind ?? "link",
                url: r.url ?? "",
                filePath: r.file_path ?? null,
                position: r.position ?? 0,
              })),
            revisionQuestion: rq
              ? {
                  id: rq.id,
                  prompt: rq.prompt ?? "",
                  options: (rq.course_revision_options ?? [])
                    .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
                    .map((o: any) => ({
                      id: o.id,
                      body: o.body ?? "",
                      explanation: o.explanation ?? "",
                      isRecommended: o.is_recommended ?? false,
                      position: o.position ?? 0,
                    })),
                }
              : null,
          };
        }),
    }));

  const quiz = quizRow
    ? {
        introCopy: quizRow.intro_copy ?? "",
        passThreshold: quizRow.pass_threshold ?? 60,
        questions: (quizRow.course_quiz_questions ?? [])
          .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
          .map((q: any) => ({
            id: q.id,
            prompt: q.prompt ?? "",
            options: (q.course_quiz_options ?? [])
              .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
              .map((o: any) => ({
                id: o.id,
                body: o.body ?? "",
                explanation: o.explanation ?? "",
                isCorrect: o.is_correct ?? false,
                position: o.position ?? 0,
              })),
          })),
      }
    : null;

  return {
    id: c.id,
    title: c.title ?? "",
    subtitle: c.subtitle ?? "",
    summary: c.summary ?? "",
    description: c.description ?? "",
    coverImageUrl: c.cover_image_url ?? "",
    introVideoProvider: c.intro_video_provider ?? null,
    introVideoUrl: c.intro_video_url ?? "",
    status: c.status ?? "draft",
    categoryId: c.category_id ?? null,
    approachId: c.approach_id ?? null,
    careType: c.care_type ?? null,
    ageMinMonths: c.age_min_months ?? null,
    ageMaxMonths: c.age_max_months ?? null,
    isFree: c.is_free ?? true,
    priceCents: c.price_cents ?? 0,
    compareAtPriceCents: c.compare_at_price_cents ?? null,
    estimatedLearningMinutes: c.estimated_learning_minutes ?? null,
    mode: c.mode ?? "Online · Self-paced",
    skipToCertEnabled: c.skip_to_cert_enabled ?? false,
    isFeatured: c.is_featured ?? false,
    skillIds: (c.course_skills ?? []).map((s: any) => s.skill_id),
    chapters,
    quiz,
    certificate: {
      signer1Name: cfg.signer1_name ?? "",
      signer1Title: cfg.signer1_title ?? "",
      signer2Name: cfg.signer2_name ?? "",
      signer2Title: cfg.signer2_title ?? "",
      footerDisclaimer:
        cfg.footer_disclaimer ??
        "This certificate recognizes completion of coursework and does not confer a professional license.",
    },
  };
}

export interface ManagedBundleRow {
  id: string;
  slug: string;
  title: string;
  status: string;
  courseCount: number;
}

export async function listManagedBundles(): Promise<ManagedBundleRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_bundles")
    .select(`id, slug, title, status, course_bundle_items ( course_id )`)
    .order("created_at", { ascending: false });
  return (data ?? []).map((b: any) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    status: b.status,
    courseCount: (b.course_bundle_items ?? []).length,
  }));
}

export async function getBundleForEdit(id: string): Promise<BundleInput | null> {
  const supabase = await createClient();
  const { data: b } = await supabase
    .from("course_bundles")
    .select(`*, course_bundle_items ( course_id, position )`)
    .eq("id", id)
    .maybeSingle();
  if (!b) return null;
  return {
    id: b.id,
    title: b.title ?? "",
    summary: b.summary ?? "",
    description: b.description ?? "",
    coverImageUrl: b.cover_image_url ?? "",
    status: b.status ?? "draft",
    isFree: b.is_free ?? true,
    priceCents: b.price_cents ?? 0,
    compareAtPriceCents: b.compare_at_price_cents ?? null,
    isFeatured: b.is_featured ?? false,
    courseIds: (b.course_bundle_items ?? [])
      .sort((a: any, b: any) => (a.position ?? 0) - (b.position ?? 0))
      .map((i: any) => i.course_id),
  };
}

/** Published + draft courses available to add to a bundle. */
export async function listCoursesForBundlePicker(): Promise<{ id: string; title: string }[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("courses")
    .select("id, title")
    .order("title");
  return (data ?? []).map((c: any) => ({ id: c.id, title: c.title }));
}
