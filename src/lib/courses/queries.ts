import { createClient } from "@/lib/supabase/server";
import type { CourseCareType } from "./types";

/* eslint-disable @typescript-eslint/no-explicit-any */

export interface CourseListItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  careType: CourseCareType | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  isFree: boolean;
  priceCents: number;
  compareAtPriceCents: number | null;
  currency: string;
  isFeatured: boolean;
  estimatedLearningMinutes: number | null;
  categoryId: string | null;
  approachId: string | null;
  moduleCount: number;
  skillIds: string[];
}

export interface CourseFilters {
  q?: string;
  categoryId?: string;
  approachId?: string;
  careType?: CourseCareType;
  skillIds?: string[];
  ageMax?: number;
}

function ageOverlaps(min: number | null, max: number | null, selMax?: number): boolean {
  if (selMax == null) return true;
  const eLo = min ?? 0;
  return eLo <= selMax; // course starts at/below the chosen age ceiling
}

function matches(item: CourseListItem, f: CourseFilters): boolean {
  if (f.q) {
    const q = f.q.toLowerCase();
    if (!`${item.title} ${item.summary ?? ""}`.toLowerCase().includes(q)) return false;
  }
  if (f.categoryId && item.categoryId !== f.categoryId) return false;
  if (f.approachId && item.approachId !== f.approachId) return false;
  if (f.careType && item.careType !== f.careType) return false;
  if (f.skillIds?.length && !f.skillIds.every((s) => item.skillIds.includes(s))) return false;
  if (!ageOverlaps(item.ageMinMonths, item.ageMaxMonths, f.ageMax)) return false;
  return true;
}

/** Published courses for the public Browse page (RLS allows anon reads). */
export async function listPublishedCourses(filters: CourseFilters = {}): Promise<CourseListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("courses")
    .select(
      `id, slug, title, summary, cover_image_url, care_type, age_min_months, age_max_months,
       is_free, price_cents, compare_at_price_cents, currency, is_featured,
       estimated_learning_minutes, category_id, approach_id,
       course_modules ( id ), course_skills ( skill_id )`,
    )
    .eq("status", "published");
  if (error || !data) return [];

  const items: CourseListItem[] = data.map((c: any) => ({
    id: c.id,
    slug: c.slug,
    title: c.title,
    summary: c.summary,
    coverImageUrl: c.cover_image_url,
    careType: c.care_type,
    ageMinMonths: c.age_min_months,
    ageMaxMonths: c.age_max_months,
    isFree: c.is_free,
    priceCents: c.price_cents,
    compareAtPriceCents: c.compare_at_price_cents,
    currency: c.currency,
    isFeatured: c.is_featured,
    estimatedLearningMinutes: c.estimated_learning_minutes,
    categoryId: c.category_id,
    approachId: c.approach_id,
    moduleCount: (c.course_modules ?? []).length,
    skillIds: (c.course_skills ?? []).map((s: any) => s.skill_id),
  }));

  return items
    .filter((it) => matches(it, filters))
    .sort((a, b) => (a.isFeatured !== b.isFeatured ? (a.isFeatured ? -1 : 1) : a.title.localeCompare(b.title)));
}

export interface PublishedBundleItem {
  id: string;
  slug: string;
  title: string;
  summary: string | null;
  coverImageUrl: string | null;
  isFree: boolean;
  priceCents: number;
  compareAtPriceCents: number | null;
  currency: string;
  isFeatured: boolean;
  courseCount: number;
}

export async function listPublishedBundles(): Promise<PublishedBundleItem[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("course_bundles")
    .select(
      `id, slug, title, summary, cover_image_url, is_free, price_cents, compare_at_price_cents,
       currency, is_featured, course_bundle_items ( course_id )`,
    )
    .eq("status", "published");
  return (data ?? []).map((b: any) => ({
    id: b.id,
    slug: b.slug,
    title: b.title,
    summary: b.summary,
    coverImageUrl: b.cover_image_url,
    isFree: b.is_free,
    priceCents: b.price_cents,
    compareAtPriceCents: b.compare_at_price_cents,
    currency: b.currency,
    isFeatured: b.is_featured,
    courseCount: (b.course_bundle_items ?? []).length,
  }));
}

export interface CourseTaxonomyLite {
  categories: { id: string; label: string }[];
  approaches: { id: string; label: string }[];
  skills: { id: string; label: string }[];
}

export async function getPublicTaxonomy(): Promise<CourseTaxonomyLite> {
  const supabase = await createClient();
  const [cats, apps, skills] = await Promise.all([
    supabase.from("course_categories").select("id, label").order("position"),
    supabase.from("course_approaches").select("id, label").order("position"),
    supabase.from("skills").select("id, label").order("label"),
  ]);
  return {
    categories: (cats.data ?? []) as any,
    approaches: (apps.data ?? []) as any,
    skills: (skills.data ?? []) as any,
  };
}

/** Parse /courses URL params into typed filters. */
export function parseCourseFilters(sp: Record<string, string | string[] | undefined>): CourseFilters {
  const one = (k: string) => {
    const v = sp[k];
    return Array.isArray(v) ? v[0] : v;
  };
  const num = (k: string) => {
    const v = one(k);
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const skills = one("skills");
  return {
    q: one("q") || undefined,
    categoryId: one("category") || undefined,
    approachId: one("approach") || undefined,
    careType: (one("care") as CourseCareType) || undefined,
    skillIds: skills ? skills.split(",").filter(Boolean) : undefined,
    ageMax: num("ageMax"),
  };
}
