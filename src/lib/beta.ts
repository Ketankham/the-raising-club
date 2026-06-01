/**
 * Beta lock — gates new sign-ups and shows a beta banner on the LIVE
 * (production) site only. It is deliberately NEVER active on local `npm run dev`
 * or on Vercel preview deploys, so the team can keep building and testing the
 * full onboarding flow normally.
 *
 * Default behaviour is driven by Vercel's system env var VERCEL_ENV, which is
 * "production" only on the live deployment (theraisingclub.com), "preview" on
 * branch deploys, and undefined locally.
 *
 * Override with the BETA_LOCK env var (set it in the Vercel dashboard):
 *   BETA_LOCK=1  -> force the lock ON  (e.g. to preview it on a branch deploy)
 *   BETA_LOCK=0  -> lift the lock on production at launch, with no code change
 */
export function isBetaLocked(): boolean {
  const override = process.env.BETA_LOCK;
  if (override === "1" || override === "true") return true;
  if (override === "0" || override === "false") return false;
  return process.env.VERCEL_ENV === "production";
}
