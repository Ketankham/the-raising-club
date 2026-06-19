import 'server-only';

const BASE = 'https://api-v3.authenticating.com';

function apiKey(): string {
  const key = process.env.AUTHENTICATE_API_KEY;
  if (!key) throw new Error('AUTHENTICATE_API_KEY is not set');
  return key;
}

/** Create a new Authenticate user for a caregiver. Returns the userAccessCode. */
export async function createAuthenticateUser(params: {
  firstName: string;
  lastName: string;
  email: string;
}): Promise<string> {
  const res = await fetch(`${BASE}/user/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      firstName: params.firstName,
      lastName: params.lastName,
      email: params.email,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Authenticate createUser failed ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.userAccessCode as string;
}

/** Generate a fresh Medallion™ hosted verification URL from a stored userAccessCode. */
export async function getMedallionUrl(userAccessCode: string, redirectUrl?: string): Promise<string> {
  const res = await fetch(`${BASE}/user/medallion/link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({
      userAccessCode,
      ...(redirectUrl ? { redirectUrl } : {}),
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Authenticate getMedallionUrl failed ${res.status}: ${body}`);
  }
  const data = await res.json();
  return data.url as string;
}

/**
 * Fetch the latest identity result directly from Authenticate.
 * Used as a fallback when the SELF_VERIFICATION_TRY_STATUS webhook never arrived.
 */
export async function getTestResult(userAccessCode: string): Promise<'verified' | 'failed' | 'pending' | null> {
  try {
    const res = await fetch(`${BASE}/user/gettestresult`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({ userAccessCode }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const status = (data.status as string | undefined)?.toLowerCase();
    if (status === 'verified') return 'verified';
    if (status === 'failed' || status === 'not verified') return 'failed';
    if (status === 'pending') return 'pending';
    return null;
  } catch {
    return null;
  }
}
