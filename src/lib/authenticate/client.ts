import 'server-only';

const BASE = 'https://api-v3.authenticating.com';

function apiKey(): string {
  const key = process.env.AUTHENTICATE_API_KEY;
  if (!key) throw new Error('AUTHENTICATE_API_KEY is not set');
  return key;
}

/** Create a new Authenticate user for a caregiver. Returns the userAccessCode.
 *  dob must be in DD-MM-YYYY format (required by the Authenticate API). */
export async function createAuthenticateUser(params: {
  firstName: string;
  lastName: string;
  email: string;
  dob: string; // DD-MM-YYYY
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
      dob: params.dob,
    }),
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Authenticate createUser failed ${res.status}: ${body}`);
  }
  const data = await res.json();
  const code = (data.userAccessCode ?? data.userCode ?? data.accessCode ?? data.code) as string | undefined;
  if (!code) throw new Error(`Authenticate createUser: no userAccessCode in response: ${JSON.stringify(data)}`);
  console.log('[authenticate] created user, code prefix:', code.slice(0, 8));
  return code;
}

/** Generate a fresh Medallion™ hosted verification URL from a stored userAccessCode.
 *  Uses POST /user/jwt → constructs https://verify.authenticating.com/?token=... */
export async function getMedallionUrl(userAccessCode: string, redirectUrl?: string): Promise<string> {
  const body: Record<string, string> = { userAccessCode };
  if (redirectUrl) body.redirectURL = redirectUrl;

  const res = await fetch(`${BASE}/user/jwt`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Authenticate getMedallionUrl failed ${res.status}: ${text}`);
  }
  const data = await res.json();
  const token = (data.token ?? data.jwt) as string | undefined;
  if (!token) throw new Error(`Authenticate getMedallionUrl: no token in response: ${JSON.stringify(data)}`);
  return `https://verify.authenticating.com/?token=${token}`;
}

/** Initiate asynchronous PDF report generation for a user.
 *  Report is delivered via USER_PDF_REPORT_GENERATION webhook (10-20s).
 *  Returns true if the request was accepted. */
export async function initiatePdfReport(userAccessCode: string): Promise<boolean> {
  const res = await fetch(`${BASE}/user/initiate/pdf/report`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey()}`,
    },
    body: JSON.stringify({ userAccessCode }),
  });
  return res.ok;
}

/** Retrieve the PDF report URL generated for a user (call after initiatePdfReport).
 *  Returns the URL string, or null if not ready yet. */
export async function retrievePdfReport(userAccessCode: string): Promise<string | null> {
  try {
    const res = await fetch(`${BASE}/user/retrieve/pdf/report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey()}`,
      },
      body: JSON.stringify({ userAccessCode }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return (data.url ?? data.reportUrl ?? data.pdfUrl ?? data.link) as string | null ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch the latest identity result directly from Authenticate.
 * Used as a fallback when the SELF_VERIFICATION_TRY_STATUS webhook never arrived.
 */
export async function getTestResult(userAccessCode: string): Promise<'verified' | 'failed' | 'pending' | null> {
  const data = await getFullTestResult(userAccessCode);
  if (!data) return null;
  const status = (data.status as string | undefined)?.toLowerCase();
  if (status === 'verified') return 'verified';
  if (status === 'failed' || status === 'not verified') return 'failed';
  if (status === 'pending') return 'pending';
  return null;
}

/**
 * Fetch the full raw result object from Authenticate — contains extracted document
 * fields: firstName, lastName, dateOfBirth, nationality, gender, documentType, etc.
 * Exact field names vary by document/country; we store the whole object in metadata.
 */
export async function getFullTestResult(userAccessCode: string): Promise<Record<string, unknown> | null> {
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
    return await res.json() as Record<string, unknown>;
  } catch {
    return null;
  }
}
