import { Logo } from "@/components/logo";
import { durationLabel } from "@/lib/courses/format";
import type { CertificateView } from "@/lib/courses/learner-queries";

function ddmmyyyy(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`;
}

/** The completion certificate (Figma p59). Print-friendly. */
export function CertificateCard({
  cert,
  qrDataUrl,
  verifyHost,
}: {
  cert: CertificateView;
  qrDataUrl: string;
  verifyHost: string;
}) {
  const learnTime = durationLabel(cert.estimatedLearningMinutes);

  return (
    <div id="certificate-card" className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-[#fcf6ec] px-8 py-10 shadow-sm sm:px-14 sm:py-14 print:border print:shadow-none">
      {/* decorative blobs */}
      <div className="pointer-events-none absolute -left-10 top-8 h-40 w-40 rounded-full bg-mint/50 blur-2xl" aria-hidden />
      <div className="pointer-events-none absolute -right-8 bottom-10 h-44 w-44 rounded-full bg-purple/40 blur-2xl" aria-hidden />

      <div className="relative">
        <div className="flex flex-col items-center text-center">
          <Logo />
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-ink-soft">
            Professional Learning in Early Childhood &amp; Caregiving
          </p>

          <h1 className="mt-7 font-display text-3xl font-bold text-ink">Certificate of Completion</h1>
          <p className="mt-6 text-sm text-ink-soft">This certifies that</p>
          <p className="mt-2 font-serif text-4xl italic text-ink sm:text-5xl">{cert.recipientName}</p>
          <p className="mt-4 text-sm text-ink-soft">has successfully fulfilled the requirements and completed the course</p>
          <p className="mt-3 font-display text-2xl font-bold text-ink">{cert.courseTitle}</p>
        </div>

        <div className="mx-auto mt-9 grid max-w-xl grid-cols-2 gap-y-2 text-xs text-ink-soft">
          <span>Completion Date: {ddmmyyyy(cert.issuedAt)}</span>
          <span>Certificate ID: {cert.certificateId}</span>
          {learnTime && <span>Estimated Learning Time: {learnTime}</span>}
          {cert.mode && <span>Mode: {cert.mode}</span>}
        </div>

        <div className="mt-10 flex items-end justify-between gap-6">
          <div className="grid flex-1 grid-cols-2 gap-6">
            {(cert.signer1Name || cert.signer1Title) && (
              <div className="text-center">
                <p className="font-serif text-lg italic text-ink">{cert.signer1Name}</p>
                <div className="mx-auto mt-1 border-t border-ink/30 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">{cert.signer1Title}</p>
                  <p className="text-[10px] text-ink-soft/70">Authorized Signature</p>
                </div>
              </div>
            )}
            {(cert.signer2Name || cert.signer2Title) && (
              <div className="text-center">
                <p className="font-serif text-lg italic text-ink">{cert.signer2Name}</p>
                <div className="mx-auto mt-1 border-t border-ink/30 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-ink-soft">{cert.signer2Title}</p>
                  <p className="text-[10px] text-ink-soft/70">Instructor of Record</p>
                </div>
              </div>
            )}
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Verification QR code" className="h-20 w-20 shrink-0" />
        </div>

        <div className="mt-8 border-t border-ink/10 pt-3 text-center text-[10px] text-ink-soft/80">
          {cert.footerDisclaimer && <p>{cert.footerDisclaimer}</p>}
          <p className="mt-0.5">Verify: {verifyHost}/verify/{cert.verifyToken}</p>
        </div>
      </div>
    </div>
  );
}
