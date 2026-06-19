import 'server-only';
import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { emitNotification } from '@/lib/notifications/emit';
import { getFullTestResult, triggerBackgroundChecks, enrollTCM } from './client';
import type { AuthWebhookPayload, VerificationMetadata } from './types';

type AdminClient = NonNullable<ReturnType<typeof createAdminClient>>;

/**
 * Dispatch an Authenticate webhook payload to the correct handler.
 * All handlers upsert on (user_id, type) and are idempotent — Authenticate
 * retries on non-2xx, so duplicate deliveries must be safe.
 */
export async function handleAuthenticateWebhook(payload: AuthWebhookPayload): Promise<void> {
  const admin = createAdminClient();
  if (!admin) {
    console.error('[authenticate webhook] SUPABASE_SERVICE_ROLE_KEY missing');
    return;
  }

  switch (payload.event) {
    case 'SELF_VERIFICATION_TRY_STATUS':
      await handleIdentityStatus(admin, payload);
      break;
    case 'ALL_CRIMINAL_REQUESTS_COMPLETE':
    case 'SEVEN_YEAR_CRIMINAL_REQUEST_UPDATE':
    case 'CRIMINAL_REQUEST_STATUS_UPDATE':
      await handleBackgroundCheckComplete(admin, payload);
      break;
    case 'SEX_OFFENDER_CHECK_STATUS_UPDATE':
      await handleSexOffenderUpdate(admin, payload);
      break;
    case 'USER_PDF_REPORT_GENERATION':
      await handlePdfGenerated(admin, payload);
      break;
    default:
      console.log('[authenticate webhook] unhandled event:', (payload as { event: string }).event);
  }
}

async function resolveUserId(admin: AdminClient, userCode: string): Promise<string | null> {
  const { data } = await admin
    .from('caregiver_profiles')
    .select('user_id')
    .eq('authenticate_user_code', userCode)
    .single();
  return data?.user_id ?? null;
}

async function handleIdentityStatus(admin: AdminClient, payload: AuthWebhookPayload): Promise<void> {
  const userId = await resolveUserId(admin, payload.userCode);
  if (!userId) {
    console.warn('[authenticate webhook] unknown userCode:', payload.userCode);
    return;
  }

  const rawStatus = (payload.status ?? '').toLowerCase();
  const status = rawStatus === 'verified' ? 'verified' : rawStatus === 'pending' ? 'pending' : 'failed';
  const metadata: VerificationMetadata = { rawStatus: payload.status, rawResult: payload.result };

  // On verified: fetch full document extraction data (name, nationality, gender, DOB,
  // document type, etc.) and store under metadata.idDocument so admins can review.
  if (status === 'verified') {
    const fullResult = await getFullTestResult(payload.userCode);
    if (fullResult) metadata.idDocument = fullResult;
  }

  await admin.from('verifications').upsert(
    { user_id: userId, type: 'identity', status, provider: 'authenticate', reference: payload.userCode, metadata, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,type' }
  );

  revalidatePath('/profile');
  revalidatePath('/es/profile');
  revalidatePath('/admin/verifications');
  revalidatePath('/es/admin/verifications');

  if (status === 'verified') {
    await emitNotification({ typeKey: 'caregiver.identity_verified', userId });
    // Auto-trigger all background checks now that identity is confirmed.
    // Results arrive asynchronously via ALL_CRIMINAL_REQUESTS_COMPLETE and
    // SEX_OFFENDER_CHECK_STATUS_UPDATE webhooks — fire and don't await.
    triggerBackgroundChecks(payload.userCode).catch((err) =>
      console.error('[authenticate webhook] triggerBackgroundChecks failed:', err)
    );
  }
}

async function handleBackgroundCheckComplete(admin: AdminClient, payload: AuthWebhookPayload): Promise<void> {
  const userId = await resolveUserId(admin, payload.userCode);
  if (!userId) return;

  const result = payload.result ?? {};
  const hasRecords = !!(result.criminalRecordsFound || result.hasRecords || result.records_found);
  const status = hasRecords ? 'failed' : 'verified';
  const metadata: VerificationMetadata = {
    rawStatus: payload.status,
    rawResult: result,
    ...(hasRecords ? { redFlag: true, redFlagType: 'criminal_record', detectedAt: new Date().toISOString() } : {}),
  };

  await admin.from('verifications').upsert(
    { user_id: userId, type: 'background_check', status, provider: 'authenticate', reference: payload.userCode, metadata, admin_review_required: hasRecords, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,type' }
  );

  revalidatePath('/profile');
  revalidatePath('/es/profile');
  revalidatePath('/admin/verifications');
  revalidatePath('/es/admin/verifications');

  if (!hasRecords) {
    await emitNotification({ typeKey: 'caregiver.background_check_complete', userId });
    // Both identity AND background check are now clean — enroll in TCM.
    // Fire and forget; failure is non-fatal (can be enrolled manually later).
    enrollTCM(payload.userCode).then((ok) => {
      if (!ok) console.warn('[authenticate webhook] TCM enroll failed for', payload.userCode);
    }).catch(() => {});
  } else {
    await notifyAdmins(admin, 'admin.verification_review_required', userId);
  }
}

async function handleSexOffenderUpdate(admin: AdminClient, payload: AuthWebhookPayload): Promise<void> {
  const userId = await resolveUserId(admin, payload.userCode);
  if (!userId) return;

  const result = payload.result ?? {};
  const isMatch = !!(result.match || result.found || result.offenderFound || result.sex_offender_found);
  if (!isMatch) return;

  const metadata: VerificationMetadata = {
    rawStatus: payload.status,
    rawResult: result,
    redFlag: true,
    redFlagType: 'sex_offender',
    detectedAt: new Date().toISOString(),
  };

  await admin.from('verifications').upsert(
    { user_id: userId, type: 'background_check', status: 'failed', provider: 'authenticate', reference: payload.userCode, metadata, admin_review_required: true, updated_at: new Date().toISOString() },
    { onConflict: 'user_id,type' }
  );

  // Immediately depublish and soft-deactivate
  await admin.from('caregiver_profiles').update({ is_published: false }).eq('user_id', userId);
  await admin.from('profiles').update({ deactivated_at: new Date().toISOString() }).eq('id', userId);

  revalidatePath('/profile');
  revalidatePath('/es/profile');
  revalidatePath('/admin/verifications');
  revalidatePath('/es/admin/verifications');

  await notifyAdmins(admin, 'admin.verification_red_flag', userId, {
    flag_type: 'Sex offender registry match',
    action_taken: 'immediately depublished and deactivated',
  });

  await notifyConnectedUsers(admin, userId);
}

async function handlePdfGenerated(admin: AdminClient, payload: AuthWebhookPayload): Promise<void> {
  const userId = await resolveUserId(admin, payload.userCode);
  if (!userId || !payload.reportUrl) return;

  const { data: existing } = await admin
    .from('verifications')
    .select('metadata')
    .eq('user_id', userId)
    .eq('type', 'background_check')
    .single();

  const updatedMetadata = { ...(existing?.metadata ?? {}), reportUrl: payload.reportUrl };
  await admin
    .from('verifications')
    .update({ metadata: updatedMetadata, updated_at: new Date().toISOString() })
    .eq('user_id', userId)
    .eq('type', 'background_check');
}

async function notifyAdmins(
  admin: AdminClient,
  typeKey: string,
  caregiverId: string,
  extraVars: Record<string, string> = {},
): Promise<void> {
  const { data: profile } = await admin
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', caregiverId)
    .single();

  const caregiverName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'Unknown';
  const caregiverEmail = (profile?.email as string | undefined) ?? '';

  const { data: admins } = await admin.from('profiles').select('id').eq('role', 'admin');

  for (const adm of admins ?? []) {
    await emitNotification({
      typeKey,
      userId: adm.id,
      vars: { caregiver_name: caregiverName, caregiver_email: caregiverEmail, ...extraVars },
      link: `/admin/verifications?user=${caregiverId}`,
    });
  }
}

async function notifyConnectedUsers(admin: AdminClient, caregiverId: string): Promise<void> {
  // Two-step: get this caregiver's conversation IDs, then all other participants
  const { data: caregiverConvos } = await admin
    .from('conversation_participants')
    .select('conversation_id')
    .eq('user_id', caregiverId);

  const convIds = (caregiverConvos ?? []).map((r: { conversation_id: string }) => r.conversation_id);
  if (!convIds.length) return;

  const { data: peers } = await admin
    .from('conversation_participants')
    .select('user_id')
    .in('conversation_id', convIds)
    .neq('user_id', caregiverId);

  const { data: profile } = await admin
    .from('profiles')
    .select('first_name, preferred_name')
    .eq('id', caregiverId)
    .single();

  const caregiverName = (profile?.preferred_name as string | undefined) || (profile?.first_name as string | undefined) || 'The caregiver';
  const notified = new Set<string>();

  for (const row of peers ?? []) {
    const uid = (row as { user_id: string }).user_id;
    if (notified.has(uid)) continue;
    notified.add(uid);
    await emitNotification({ typeKey: 'parent.caregiver_unavailable', userId: uid, vars: { caregiver_name: caregiverName } });
  }
}
