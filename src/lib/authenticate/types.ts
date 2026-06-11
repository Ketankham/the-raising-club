// Types for the Authenticate (authenticate.com) API and internal verification state.

export type VerificationStatus = 'not_started' | 'pending' | 'verified' | 'failed' | 'expired';

/** Stored in verifications.metadata JSONB */
export interface VerificationMetadata {
  reportUrl?: string;
  rawStatus?: string;
  rawResult?: Record<string, unknown>;
  redFlag?: boolean;
  redFlagType?: 'sex_offender' | 'criminal_record';
  detectedAt?: string;
}

/** Our internal view of a caregiver's verification state (read from DB) */
export interface CaregiverVerificationState {
  identityStatus: VerificationStatus;
  backgroundStatus: VerificationStatus;
  identityAdminReview: boolean;
  backgroundAdminReview: boolean;
  hasAuthenticateUser: boolean;
}

/** Webhook event names fired by Authenticate */
export type AuthWebhookEvent =
  | 'SELF_VERIFICATION_TRY_STATUS'
  | 'ALL_CRIMINAL_REQUESTS_COMPLETE'
  | 'SEX_OFFENDER_CHECK_STATUS_UPDATE'
  | 'USER_PDF_REPORT_GENERATION'
  | 'CRIMINAL_REQUEST_STATUS_UPDATE'
  | 'SEVEN_YEAR_CRIMINAL_REQUEST_UPDATE';

/** Shape of an incoming Authenticate webhook payload (partial — fields we use) */
export interface AuthWebhookPayload {
  event: AuthWebhookEvent;
  userCode: string;
  status?: string;
  result?: Record<string, unknown>;
  reportUrl?: string;
}
