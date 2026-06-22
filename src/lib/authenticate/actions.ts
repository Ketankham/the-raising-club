'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUserProfile } from '@/lib/guards';
import { createAuthenticateUser, getMedallionUrl, getTestResult, getFullTestResult, initiatePdfReport, retrievePdfReport, runRiskScore, triggerBackgroundChecks } from './client';

/** Start or resume identity verification. Returns the Medallion™ hosted URL.
 *  dob is required on first call (DD-MM-YYYY); ignored on resume (code already exists). */
export async function startVerification(dob?: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const { user, profile } = await requireUserProfile();
    if (profile.role !== 'caregiver') return { ok: false, error: 'Not a caregiver account' };

    const supabase = await createClient();
    const { data: cp } = await supabase
      .from('caregiver_profiles')
      .select('authenticate_user_code, date_of_birth')
      .eq('user_id', user.id)
      .single();

    let userCode = (cp?.authenticate_user_code as string | null) ?? null;

    if (!userCode) {
      // DOB required by Authenticate API. Use stored value if available, otherwise use the passed value.
      const storedDob = (cp?.date_of_birth as string | null) ?? null;
      // Both storedDob (DB) and dob (form input) are YYYY-MM-DD; API requires DD-MM-YYYY.
      const toApiFormat = (d: string) => { const [y, m, day] = d.split('-'); return `${day}-${m}-${y}`; };
      const effectiveDob = storedDob ? toApiFormat(storedDob) : dob ? toApiFormat(dob) : '';
      if (!effectiveDob) return { ok: false, error: 'Date of birth is required to start verification.' };

      // Save DOB for future retries before calling the API
      if (dob && !storedDob) {
        await supabase.from('caregiver_profiles').update({ date_of_birth: dob }).eq('user_id', user.id);
      }

      userCode = await createAuthenticateUser({
        firstName: (profile.first_name as string | null) ?? '',
        lastName: (profile.last_name as string | null) ?? '',
        email: (profile.email as string | null) ?? '',
        dob: effectiveDob,
      });

      // Run risk score immediately after user creation — result stored on profiles.
      // Fire and forget so it never delays the Medallion redirect.
      storeRiskScore(supabase, user.id, userCode).catch(() => {});

      // Atomic write: only stores if still null (prevents double-create on race)
      const { data: updated } = await supabase
        .from('caregiver_profiles')
        .update({ authenticate_user_code: userCode })
        .eq('user_id', user.id)
        .is('authenticate_user_code', null)
        .select('authenticate_user_code')
        .single();

      // If race — another request won — read the winner's code
      if (!updated) {
        const { data: fresh } = await supabase
          .from('caregiver_profiles')
          .select('authenticate_user_code')
          .eq('user_id', user.id)
          .single();
        userCode = (fresh?.authenticate_user_code as string | null) ?? userCode;
      }
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://theraisingclub.com');
    try {
      const url = await getMedallionUrl(userCode!, `${siteUrl}/profile`);
      console.log('[authenticate] Medallion URL:', url?.slice(0, 80));
      return { ok: true, url };
    } catch (medallionErr) {
      // Authenticate says user already verified — webhook was missed. Sync now.
      if ((medallionErr as NodeJS.ErrnoException).code === 'ALREADY_VERIFIED') {
        return syncVerifiedStatus(user.id, userCode!);
      }
      throw medallionErr;
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[authenticate] startVerification error:', msg);
    return { ok: false, error: 'Could not start verification. Please try again.' };
  }
}

/** Fetch the real result from Authenticate and write it to our DB.
 *  Called when Medallion says "already completed" — the webhook was missed. */
async function syncVerifiedStatus(
  userId: string,
  userCode: string,
): Promise<{ ok: true; synced: true } | { ok: false; error: string }> {
  try {
    const admin = createAdminClient();
    if (!admin) return { ok: false, error: 'Server configuration error' };

    const fullResult = await getFullTestResult(userCode);
    const rawStatus = fullResult ? String((fullResult as Record<string, unknown>).status ?? '').toLowerCase() : '';
    const status: 'verified' | 'failed' | 'pending' =
      rawStatus === 'verified' ? 'verified' : rawStatus === 'failed' || rawStatus === 'not verified' ? 'failed' : 'pending';

    const metadata: Record<string, unknown> = {};
    if (status === 'verified' && fullResult) metadata.idDocument = fullResult;

    await admin.from('verifications').upsert(
      { user_id: userId, type: 'identity', status, provider: 'authenticate', reference: userCode, metadata, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,type' },
    );

    if (status === 'verified') {
      triggerBackgroundChecks(userCode).catch(() => {});
    }

    revalidatePath('/profile');
    revalidatePath('/admin/verifications');
    console.log('[authenticate] synced missed verification:', status, 'for user', userId);
    return { ok: true, synced: true };
  } catch (err) {
    console.error('[authenticate] syncVerifiedStatus error:', err instanceof Error ? err.message : err);
    return { ok: false, error: 'Could not sync verification status. Please try again.' };
  }
}

/** Poll Authenticate directly for identity result — fallback for missed webhooks. */
export async function checkVerificationStatus(): Promise<{ ok: true; status: string } | { ok: false; error: string }> {
  try {
    const { user } = await requireUserProfile();
    const supabase = await createClient();

    const { data: cp } = await supabase
      .from('caregiver_profiles')
      .select('authenticate_user_code')
      .eq('user_id', user.id)
      .single();

    const userCode = (cp?.authenticate_user_code as string | null) ?? null;
    if (!userCode) return { ok: false, error: 'No verification started yet' };

    const result = await getTestResult(userCode);
    if (!result) return { ok: false, error: 'No result available yet. Try again shortly.' };

    if (result === 'verified' || result === 'failed') {
      const admin = createAdminClient();
      if (admin) {
        const metadata: Record<string, unknown> = {};
        if (result === 'verified') {
          const fullResult = await getFullTestResult(userCode);
          if (fullResult) metadata.idDocument = fullResult;
        }
        await admin.from('verifications').upsert(
          { user_id: user.id, type: 'identity', status: result, provider: 'authenticate', reference: userCode, metadata, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,type' }
        );
      }
    }

    revalidatePath('/profile');
    return { ok: true, status: result };
  } catch (err) {
    console.error('[authenticate] checkVerificationStatus error:', err);
    return { ok: false, error: 'Could not check status. Please try again.' };
  }
}

/** Admin: approve a flagged background check (mark reviewed, keep published). */
export async function adminApproveVerification(verificationId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { user, profile } = await requireUserProfile();
    if (profile.role !== 'admin') return { ok: false, error: 'Unauthorized' };

    const admin = createAdminClient();
    if (!admin) return { ok: false, error: 'Server configuration error' };

    await admin
      .from('verifications')
      .update({ admin_review_required: false, reviewed_by: user.id, reviewed_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq('id', verificationId);

    revalidatePath('/admin/verifications');
    return { ok: true };
  } catch (err) {
    console.error('[authenticate] adminApproveVerification error:', err);
    return { ok: false, error: 'Action failed. Please try again.' };
  }
}

/** Admin: generate or retrieve the PDF verification report for a caregiver.
 *  Initiates generation if not ready, then polls up to ~20s.
 *  Returns a short-lived URL (24h) or a message to retry. */
export async function adminGenerateReport(userCode: string): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  try {
    const { profile } = await requireUserProfile();
    if (profile.role !== 'admin') return { ok: false, error: 'Unauthorized' };

    // Try to retrieve an already-generated report first
    const existing = await retrievePdfReport(userCode);
    if (existing) return { ok: true, url: existing };

    // Initiate generation
    const initiated = await initiatePdfReport(userCode);
    if (!initiated) return { ok: false, error: 'Report generation request failed. Check Authenticate account.' };

    // Poll up to 4 times × 5s = ~20s
    for (let i = 0; i < 4; i++) {
      await new Promise((r) => setTimeout(r, 5000));
      const url = await retrievePdfReport(userCode);
      if (url) return { ok: true, url };
    }

    return { ok: false, error: 'Report is still generating — refresh in 30 seconds.' };
  } catch (err) {
    console.error('[authenticate] adminGenerateReport error:', err instanceof Error ? err.message : err);
    return { ok: false, error: 'Could not generate report. Please try again.' };
  }
}

// ── Risk score helpers ────────────────────────────────────────────────────────

type SupaClient = Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>;

/** Fetch risk score from Authenticate and persist it on the profile row. */
async function storeRiskScore(supabase: SupaClient, userId: string, userCode: string): Promise<void> {
  const score = await runRiskScore(userCode);
  if (score === null) return;
  const flagged = score >= 67;
  await supabase
    .from('profiles')
    .update({ risk_score: score, risk_flagged: flagged, risk_checked_at: new Date().toISOString() })
    .eq('id', userId);
  if (flagged) {
    console.warn(`[authenticate] High risk score ${score} for user ${userId}`);
  }
}

/** Run the Authenticate risk score check for a non-caregiver user (parent / org).
 *  Creates an Authenticate user, scores them, stores result on profiles.
 *  Called fire-and-forget from onboarding on final step completion. */
export async function runRiskScoreForUser(
  userId: string,
  params: { firstName: string; lastName: string; email: string; dob: string },
): Promise<void> {
  try {
    const admin = createAdminClient();
    if (!admin) return;

    // Check if we already have a code stored on profiles
    const { data: existing } = await admin.from('profiles').select('authenticate_user_code, risk_checked_at').eq('id', userId).single();
    let userCode = (existing?.authenticate_user_code as string | null) ?? null;

    if (!userCode) {
      userCode = await createAuthenticateUser(params);
      await admin.from('profiles').update({ authenticate_user_code: userCode }).eq('id', userId);
    }

    if (!existing?.risk_checked_at) {
      await storeRiskScore(admin as unknown as SupaClient, userId, userCode);
    }
  } catch (err) {
    console.error('[authenticate] runRiskScoreForUser error:', err instanceof Error ? err.message : err);
  }
}

/** Admin: depublish a caregiver with a flagged background check. */
export async function adminDepublishCaregiver(caregiverId: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { profile } = await requireUserProfile();
    if (profile.role !== 'admin') return { ok: false, error: 'Unauthorized' };

    const admin = createAdminClient();
    if (!admin) return { ok: false, error: 'Server configuration error' };

    await admin.from('caregiver_profiles').update({ is_published: false }).eq('user_id', caregiverId);
    await admin
      .from('verifications')
      .update({ admin_review_required: false, updated_at: new Date().toISOString() })
      .eq('user_id', caregiverId)
      .eq('type', 'background_check');

    revalidatePath('/admin/verifications');
    return { ok: true };
  } catch (err) {
    console.error('[authenticate] adminDepublishCaregiver error:', err);
    return { ok: false, error: 'Action failed. Please try again.' };
  }
}
