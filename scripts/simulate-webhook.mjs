/**
 * simulate-webhook.mjs
 * Sends a fake Authenticate webhook to the staging endpoint to test
 * the full pipeline (auth → handler → DB write) without going through Medallion.
 *
 * Usage:
 *   node scripts/simulate-webhook.mjs [event] [userCode]
 *
 * Examples:
 *   node scripts/simulate-webhook.mjs SELF_VERIFICATION_TRY_STATUS a9918c6b-a531-4fff-911e-093ace247df7
 *   node scripts/simulate-webhook.mjs ALL_CRIMINAL_REQUESTS_COMPLETE a9918c6b-a531-4fff-911e-093ace247df7
 *
 * Default target: https://the-raising-club-staging.vercel.app/api/webhooks/authenticate
 * Override with WEBHOOK_URL env var.
 */

const WEBHOOK_URL = process.env.WEBHOOK_URL ??
  'https://the-raising-club-staging.vercel.app/api/webhooks/authenticate';

// Emily's test caregiver account (has authenticate_user_code set in DB)
const DEFAULT_USER_CODE = 'a9918c6b-a531-4fff-911e-093ace247df7';

const event = process.argv[2] ?? 'SELF_VERIFICATION_TRY_STATUS';
const userCode = process.argv[3] ?? DEFAULT_USER_CODE;

const PAYLOADS = {
  SELF_VERIFICATION_TRY_STATUS: {
    event: 'SELF_VERIFICATION_TRY_STATUS',
    userCode,
    status: 'verified',
    // Realistic extracted document fields (approximated)
    firstName: 'Emily',
    lastName: 'Test',
    dateOfBirth: '1993-01-16',
    nationality: 'GBR',
    gender: 'Female',
    documentType: 'PASSPORT',
    documentNumber: 'TEST123456',
    expiryDate: '2030-01-01',
    countryOfIssue: 'GBR',
  },
  SELF_VERIFICATION_TRY_STATUS_FAILED: {
    event: 'SELF_VERIFICATION_TRY_STATUS',
    userCode,
    status: 'failed',
  },
  ALL_CRIMINAL_REQUESTS_COMPLETE: {
    event: 'ALL_CRIMINAL_REQUESTS_COMPLETE',
    userCode,
    status: 'clear',
    reportSummary: 'No criminal records found.',
  },
  SEX_OFFENDER_CHECK_STATUS_UPDATE: {
    event: 'SEX_OFFENDER_CHECK_STATUS_UPDATE',
    userCode,
    status: 'clear',
  },
  USER_PDF_REPORT_GENERATION: {
    event: 'USER_PDF_REPORT_GENERATION',
    userCode,
    reportUrl: 'https://example.com/test-report.pdf',
  },
};

const payload = PAYLOADS[event] ?? { event, userCode };

console.log(`\nSending ${event} to ${WEBHOOK_URL}`);
console.log('Payload:', JSON.stringify(payload, null, 2));

const res = await fetch(WEBHOOK_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload),
});

const body = await res.text();
console.log(`\nResponse: ${res.status} ${res.statusText}`);
console.log(body);

if (res.status === 401) {
  console.log('\n⚠️  Got 401 — AUTHENTICATE_WEBHOOK_SECRET is still set in Vercel for this env.');
  console.log('   Run: npx vercel env rm AUTHENTICATE_WEBHOOK_SECRET preview --yes');
} else if (res.status === 200) {
  console.log('\n✓ Webhook accepted. Check the DB for the verification row:');
  console.log('  node scripts/check-verifications.mjs');
}
