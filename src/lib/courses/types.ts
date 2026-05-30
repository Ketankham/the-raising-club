// Shared types for the courses authoring (admin) UI + server actions.

export type CourseStatus = "draft" | "published" | "archived";
export type CourseCareType = "home_family" | "small_groups" | "schools_centers";
export type CourseVideoProvider = "youtube" | "vimeo";
export type CourseResourceKind =
  | "link"
  | "youtube"
  | "vimeo"
  | "gdoc"
  | "gdrive"
  | "file"
  | "other";

export const CARE_TYPE_LABELS: Record<CourseCareType, string> = {
  home_family: "Home & Family",
  small_groups: "Small Groups",
  schools_centers: "Schools & Centers",
};

export const RESOURCE_KIND_LABELS: Record<CourseResourceKind, string> = {
  link: "Link",
  youtube: "YouTube",
  vimeo: "Vimeo",
  gdoc: "Google Doc",
  gdrive: "Google Drive",
  file: "File",
  other: "Other",
};

export interface TaxonomyOption {
  id: string;
  label: string;
}

export interface SkillOption {
  id: string;
  label: string;
  isSpecialized: boolean;
}

export interface CourseTaxonomy {
  categories: TaxonomyOption[];
  approaches: TaxonomyOption[];
  skills: SkillOption[];
}

// ---------------------------------------------------------------------------
// Editor input shapes (client state -> server action). Every nested item keeps
// a stable `id` (real uuid) so saves upsert-and-prune instead of wiping learner
// progress.
// ---------------------------------------------------------------------------
export interface ResourceInput {
  id: string;
  label: string;
  kind: CourseResourceKind;
  url: string;
  filePath: string | null;
  position: number;
}

export interface RevisionOptionInput {
  id: string;
  body: string;
  explanation: string;
  isRecommended: boolean;
  position: number;
}

export interface RevisionQuestionInput {
  id: string;
  prompt: string;
  options: RevisionOptionInput[];
}

export interface ModuleInput {
  id: string;
  title: string;
  body: string; // HTML from the rich-text editor
  videoProvider: CourseVideoProvider | null;
  videoUrl: string;
  estMinutes: number | null;
  position: number;
  resources: ResourceInput[];
  revisionQuestion: RevisionQuestionInput | null;
}

export interface ChapterInput {
  id: string;
  title: string;
  summary: string;
  position: number;
  modules: ModuleInput[];
}

export interface QuizOptionInput {
  id: string;
  body: string;
  explanation: string;
  isCorrect: boolean;
  position: number;
}

export interface QuizQuestionInput {
  id: string;
  prompt: string;
  options: QuizOptionInput[];
}

export interface QuizInput {
  introCopy: string;
  passThreshold: number;
  questions: QuizQuestionInput[];
}

export interface CertificateConfigInput {
  signer1Name: string;
  signer1Title: string;
  signer2Name: string;
  signer2Title: string;
  footerDisclaimer: string;
}

export interface CourseBasicsInput {
  title: string;
  subtitle: string;
  summary: string;
  description: string;
  coverImageUrl: string;
  introVideoProvider: CourseVideoProvider | null;
  introVideoUrl: string;
  status: CourseStatus;
  categoryId: string | null;
  approachId: string | null;
  careType: CourseCareType | null;
  ageMinMonths: number | null;
  ageMaxMonths: number | null;
  isFree: boolean;
  priceCents: number;
  compareAtPriceCents: number | null;
  estimatedLearningMinutes: number | null;
  mode: string;
  skipToCertEnabled: boolean;
  isFeatured: boolean;
  skillIds: string[];
}

/** The whole course tree submitted by the editor. */
export interface CourseEditorInput extends CourseBasicsInput {
  id: string;
  chapters: ChapterInput[];
  quiz: QuizInput | null;
  certificate: CertificateConfigInput;
}

export interface BundleInput {
  id: string | null;
  title: string;
  summary: string;
  description: string;
  coverImageUrl: string;
  status: CourseStatus;
  isFree: boolean;
  priceCents: number;
  compareAtPriceCents: number | null;
  isFeatured: boolean;
  courseIds: string[];
}

export type SaveResult =
  | { ok: true; id: string; slug?: string }
  | { ok: false; reason: "unauthenticated" | "forbidden" | "error"; message?: string };
