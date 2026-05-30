"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CourseEditorInput, BundleInput, SaveResult } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

function slugify(title: string, fallback: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base || fallback}-${suffix}`;
}

/** Upsert the given rows (each carries a stable id), then delete any rows in
 *  the same scope that are no longer present. Preserves ids => learner progress
 *  tied to module/question ids survives edits. */
async function syncRows(
  supabase: any,
  table: string,
  rows: any[],
  scopeCol: string,
  scopeId: string,
) {
  if (rows.length) {
    const { error } = await supabase.from(table).upsert(rows);
    if (error) throw new Error(`${table}: ${error.message}`);
  }
  const ids = rows.map((r) => r.id);
  let del = supabase.from(table).delete().eq(scopeCol, scopeId);
  if (ids.length) del = del.not("id", "in", `(${ids.join(",")})`);
  const { error } = await del;
  if (error) throw new Error(`${table} prune: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Create : a minimal draft course, then redirect to the full editor.
// ---------------------------------------------------------------------------
export async function createCourse(title: string): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const slug = slugify(title, "course");
  const { data, error } = await supabase
    .from("courses")
    .insert({ title: title.trim() || "Untitled course", slug, created_by: user.id, status: "draft" })
    .select("id, slug")
    .single();

  if (error) {
    const forbidden = /row-level security|policy/i.test(error.message);
    return { ok: false, reason: forbidden ? "forbidden" : "error", message: error.message };
  }
  revalidatePath("/admin/courses");
  return { ok: true, id: data.id, slug: data.slug };
}

// ---------------------------------------------------------------------------
// Save the full course tree.
// ---------------------------------------------------------------------------
export async function saveCourseStructure(input: CourseEditorInput): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const courseId = input.id;

  try {
    // 1) Course basics.
    const { data: updated, error: courseErr } = await supabase
      .from("courses")
      .update({
        title: input.title.trim() || "Untitled course",
        subtitle: input.subtitle || null,
        summary: input.summary || null,
        description: input.description || null,
        cover_image_url: input.coverImageUrl || null,
        intro_video_provider: input.introVideoProvider,
        intro_video_url: input.introVideoUrl || null,
        status: input.status,
        category_id: input.categoryId,
        approach_id: input.approachId,
        care_type: input.careType,
        age_min_months: input.ageMinMonths,
        age_max_months: input.ageMaxMonths,
        is_free: input.isFree,
        price_cents: input.isFree ? 0 : input.priceCents,
        compare_at_price_cents: input.compareAtPriceCents,
        estimated_learning_minutes: input.estimatedLearningMinutes,
        mode: input.mode || "Online · Self-paced",
        skip_to_cert_enabled: input.skipToCertEnabled,
        is_featured: input.isFeatured,
        published_at: input.status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", courseId)
      .select("id, slug")
      .maybeSingle();
    if (courseErr) throw new Error(courseErr.message);
    if (!updated) return { ok: false, reason: "forbidden" }; // RLS filtered it out

    // 2) Flatten the tree into per-table row sets (positions from array order).
    const chapters: any[] = [];
    const modules: any[] = [];
    const resources: any[] = [];
    const revQuestions: any[] = [];
    const revOptions: any[] = [];

    input.chapters.forEach((ch, ci) => {
      chapters.push({
        id: ch.id,
        course_id: courseId,
        title: ch.title.trim() || "Untitled chapter",
        summary: ch.summary || null,
        position: ci,
      });
      ch.modules.forEach((m, mi) => {
        modules.push({
          id: m.id,
          course_id: courseId,
          chapter_id: ch.id,
          title: m.title.trim() || "Untitled module",
          body: m.body || null,
          video_provider: m.videoProvider,
          video_url: m.videoUrl || null,
          est_minutes: m.estMinutes,
          position: mi,
        });
        m.resources
          .filter((r) => r.label.trim() && (r.url.trim() || r.filePath))
          .forEach((r, ri) => {
            resources.push({
              id: r.id,
              course_id: courseId,
              module_id: m.id,
              label: r.label.trim(),
              kind: r.kind,
              url: r.url.trim() || null,
              file_path: r.filePath,
              position: ri,
            });
          });
        const rq = m.revisionQuestion;
        if (rq && rq.prompt.trim()) {
          revQuestions.push({
            id: rq.id,
            course_id: courseId,
            module_id: m.id,
            prompt: rq.prompt.trim(),
            position: 0,
          });
          rq.options
            .filter((o) => o.body.trim())
            .forEach((o, oi) => {
              revOptions.push({
                id: o.id,
                course_id: courseId,
                question_id: rq.id,
                body: o.body.trim(),
                explanation: o.explanation || null,
                is_recommended: o.isRecommended,
                position: oi,
              });
            });
        }
      });
    });

    // Order matters (FK parents before children); each step also prunes removed rows.
    await syncRows(supabase, "course_chapters", chapters, "course_id", courseId);
    await syncRows(supabase, "course_modules", modules, "course_id", courseId);
    await syncRows(supabase, "course_module_resources", resources, "course_id", courseId);
    await syncRows(supabase, "course_revision_questions", revQuestions, "course_id", courseId);
    await syncRows(supabase, "course_revision_options", revOptions, "course_id", courseId);

    // 3) Quiz.
    if (!input.quiz) {
      await supabase.from("course_quizzes").delete().eq("course_id", courseId);
    } else {
      const { data: quizRow, error: quizErr } = await supabase
        .from("course_quizzes")
        .upsert(
          {
            course_id: courseId,
            intro_copy: input.quiz.introCopy || null,
            pass_threshold: input.quiz.passThreshold,
          },
          { onConflict: "course_id" },
        )
        .select("id")
        .single();
      if (quizErr) throw new Error(quizErr.message);

      const quizQuestions: any[] = [];
      const quizOptions: any[] = [];
      input.quiz.questions.forEach((q, qi) => {
        if (!q.prompt.trim()) return;
        quizQuestions.push({
          id: q.id,
          course_id: courseId,
          quiz_id: quizRow.id,
          prompt: q.prompt.trim(),
          position: qi,
        });
        q.options
          .filter((o) => o.body.trim())
          .forEach((o, oi) => {
            quizOptions.push({
              id: o.id,
              course_id: courseId,
              question_id: q.id,
              body: o.body.trim(),
              explanation: o.explanation || null,
              is_correct: o.isCorrect,
              position: oi,
            });
          });
      });
      await syncRows(supabase, "course_quiz_questions", quizQuestions, "course_id", courseId);
      await syncRows(supabase, "course_quiz_options", quizOptions, "course_id", courseId);
    }

    // 4) Certificate config (one row per course).
    const cert = input.certificate;
    await supabase.from("course_certificate_config").upsert(
      {
        course_id: courseId,
        signer1_name: cert.signer1Name || null,
        signer1_title: cert.signer1Title || null,
        signer2_name: cert.signer2Name || null,
        signer2_title: cert.signer2Title || null,
        footer_disclaimer: cert.footerDisclaimer || null,
      },
      { onConflict: "course_id" },
    );

    // 5) Skills (small set; replace wholesale — no learner data attached here).
    await supabase.from("course_skills").delete().eq("course_id", courseId);
    if (input.skillIds.length) {
      await supabase.from("course_skills").insert(
        input.skillIds.map((skill_id, i) => ({ course_id: courseId, skill_id, position: i })),
      );
    }

    revalidatePath("/admin/courses");
    revalidatePath(`/admin/courses/${courseId}/edit`);
    revalidatePath("/courses");
    return { ok: true, id: courseId, slug: updated.slug };
  } catch (e: any) {
    return { ok: false, reason: "error", message: e?.message ?? "Save failed" };
  }
}

export async function deleteCourse(id: string): Promise<SaveResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("courses").delete().eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  revalidatePath("/admin/courses");
  return { ok: true, id };
}

// ---------------------------------------------------------------------------
// Bundles
// ---------------------------------------------------------------------------
export async function saveBundle(input: BundleInput): Promise<SaveResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, reason: "unauthenticated" };

  const row = {
    title: input.title.trim() || "Untitled path",
    summary: input.summary || null,
    description: input.description || null,
    cover_image_url: input.coverImageUrl || null,
    status: input.status,
    is_free: input.isFree,
    price_cents: input.isFree ? 0 : input.priceCents,
    compare_at_price_cents: input.compareAtPriceCents,
    is_featured: input.isFeatured,
    published_at: input.status === "published" ? new Date().toISOString() : null,
  };

  let bundleId = input.id;
  if (!bundleId) {
    const { data, error } = await supabase
      .from("course_bundles")
      .insert({ ...row, slug: slugify(input.title, "path"), created_by: user.id })
      .select("id")
      .single();
    if (error) {
      const forbidden = /row-level security|policy/i.test(error.message);
      return { ok: false, reason: forbidden ? "forbidden" : "error", message: error.message };
    }
    bundleId = data.id;
  } else {
    const { data, error } = await supabase
      .from("course_bundles")
      .update(row)
      .eq("id", bundleId)
      .select("id")
      .maybeSingle();
    if (error) return { ok: false, reason: "error", message: error.message };
    if (!data) return { ok: false, reason: "forbidden" };
  }

  await supabase.from("course_bundle_items").delete().eq("bundle_id", bundleId);
  if (input.courseIds.length) {
    await supabase.from("course_bundle_items").insert(
      input.courseIds.map((course_id, i) => ({ bundle_id: bundleId, course_id, position: i })),
    );
  }

  revalidatePath("/admin/courses/bundles");
  revalidatePath("/courses");
  return { ok: true, id: bundleId! };
}

export async function deleteBundle(id: string): Promise<SaveResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("course_bundles").delete().eq("id", id);
  if (error) return { ok: false, reason: "error", message: error.message };
  revalidatePath("/admin/courses/bundles");
  return { ok: true, id };
}
