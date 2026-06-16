'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUserProfile } from '@/lib/guards';
import { createAuthenticateUser, getMedallionUrl, getTestResult } from './client';

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

    const url = await getMedallionUrl(userCode!);
    console.log('[authenticate] Medallion URL:', url?.slice(0, 80));
    return { ok: true, url };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('[authenticate] startVerification error:', msg);
    return { ok: false, error: `Debug: ${msg}` };
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
        await admin.from('verifications').upsert(
          { user_id: user.id, type: 'identity', status: result, provider: 'authenticate', reference: userCode, updated_at: new Date().toISOString() },
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
