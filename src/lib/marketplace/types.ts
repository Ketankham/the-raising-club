// Domain types for the Marketplace (Find Caregivers / Connect Families / Jobs /
// Chat). DB type generation is blocked (needs Docker) so queries stay untyped
// and map into these hand-written types — same pattern as lib/events + profile.
// Backing schema: supabase/migrations/0023–0026.

import type { CareType } from "./format";

// --- Find Caregivers (Figma slides 1–2) ------------------------------------

export interface CaregiverCard {
  userId: string;
  firstName: string | null;
  lastInitial: string;
  preferredName: string | null;
  zip: string | null;
  avatarUrl: string | null;
  headline: string | null;
  about: string | null;
  experienceLevel: string | null;
  rateAmount: number | null;
  rateUnit: string | null;
  lookingForPaidWork: boolean;
  idVerified: boolean;
  ratingAvg: number | null;
  ratingCount: number;
  skills: string[];
  ageGroups: string[];     // age_group enum values
  careSettings: string[];  // care_setting enum values
  isSaved: boolean;
  lat: number | null;
  lng: number | null;
}

// --- Connect Families (Figma slide 3) --------------------------------------

export interface FamilyCard {
  userId: string;
  householdName: string;
  headline: string | null;
  about: string | null;
  careNeeds: string | null;
  locationLabel: string | null;
  zip: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetUnit: string;
  careType: CareType | null;
  coverPhotoUrl: string | null;
  coHireInterested: boolean;
  childrenCount: number;
  ageGroups: string[];   // age_group enum values
  schedule: string[];    // schedule_window enum values
  openTo: string[];      // family_open_to enum values
  traits: string[];
  isSaved: boolean;
}

/** Create/edit payload for the family listing editor. */
export interface FamilyListingInput {
  householdName?: string;
  headline?: string;
  about?: string;
  careNeeds?: string;
  locationLabel?: string;
  zipCode?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetUnit: string;
  careType?: CareType | null;
  coverPhotoUrl?: string;
  coHireInterested: boolean;
  ageGroups: string[];   // age_group enum values
  schedule: string[];    // schedule_window enum values
  openTo: string[];      // family_open_to enum values
  traits: string[];      // family_traits ids
  isPublished: boolean;
}

export interface TraitOption {
  id: string;
  label: string;
}

// --- Jobs (job_posts) ------------------------------------------------------

// 0005 enum values. The UI labels 'open' as "Active".
export type JobStatus = "draft" | "open" | "closed" | "filled";

/** A job in the inviter's "open jobs" list inside the Invite-to-Co-Hire modal. */
export interface OwnJobOption {
  id: string;
  title: string;
  status: JobStatus;
}

/** Job summary for the Find Jobs grid + detail. */
export interface JobCard {
  id: string;
  title: string;
  description: string | null;
  status: JobStatus;
  careType: CareType | null;
  locationLabel: string | null;
  payMin: number | null;
  payMax: number | null;
  payUnit: string;
  hoursPerWeek: number | null;
  scheduleLabel: string | null;
  schedule: string[];
  ages: string[];
  skills: string[];
  isCoHire: boolean;
  openings: number;
  startDate: string | null;
  publishedAt: string | null;
  isOrg: boolean;
  applicantCount?: number;   // owner view
  myApplicationStatus?: string | null; // caregiver view
  isSaved?: boolean;
}

/** Create/edit payload for the job form. */
export interface JobFormInput {
  title: string;
  description?: string;
  careType?: CareType | null;
  ages: string[];          // age_group enum values
  schedule: string[];      // schedule_window enum values
  scheduleLabel?: string;
  payMin?: number | null;
  payMax?: number | null;
  payUnit: string;
  hoursPerWeek?: number | null;
  locationLabel?: string;
  zipCode?: string;
  startDate?: string | null;
  isCoHire: boolean;
  openings: number;
  skills: string[];        // skill ids
  orgId?: string | null;   // post on behalf of an org
  status: "draft" | "open";
}

/** Loaded shape for editing a job. */
export interface JobForEdit extends JobFormInput {
  id: string;
}

export interface SkillOption {
  id: string;
  label: string;
}

// --- My Applications (caregiver) -------------------------------------------

/** A caregiver's application to a job. */
export interface ApplicationItem {
  id: string;
  status: string;
  coverNote: string | null;
  proposedRate: number | null;
  createdAt: string;
  jobId: string;
  jobTitle: string;
  jobStatus: JobStatus;
  payMin: number | null;
  payMax: number | null;
  payUnit: string;
  locationLabel: string | null;
}

/** A co-hire invitation a caregiver received. */
export interface InvitationItem {
  id: string;
  status: string;
  message: string | null;
  createdAt: string;
  jobId: string;
  jobTitle: string;
  jobStatus: JobStatus;
  payMin: number | null;
  payMax: number | null;
  payUnit: string;
  locationLabel: string | null;
}

// --- Chat ------------------------------------------------------------------

export interface ChatPeer {
  userId: string;
  name: string;
  avatarUrl: string | null;
  role: string | null;
}

export interface ConversationSummary {
  conversationId: string;
  lastMessageAt: string;
  contextType: string | null;
  lastMessage: string | null;
  lastSenderId: string | null;
  unreadCount: number;
  peers: ChatPeer[];
}

export interface ThreadMessage {
  id: string;
  senderId: string | null;
  body: string;
  createdAt: string;
}

export interface ChatThread {
  conversationId: string;
  peers: ChatPeer[];
  messages: ThreadMessage[];
}

// --- Shared filters --------------------------------------------------------

/** Filters parsed from the URL on /connect + /connect/families + /jobs. */
export interface MarketplaceFilters {
  q?: string;
  careTypes?: CareType[];
  /** child age window in MONTHS (Age Groups slider) */
  ageMin?: number;
  ageMax?: number;
  /** city or zip text match */
  where?: string;
}
