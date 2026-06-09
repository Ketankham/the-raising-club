import { BadgeCheck, ShieldX } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { verifyCertificate } from "@/lib/courses/learner-queries";

export const metadata = { title: "Verify Certificate — The Raising Club" };

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

export default async function VerifyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const result = await verifyCertificate(token);
  const valid = result?.valid === true;

  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="mx-auto max-w-lg px-5 py-16">
          <div className="rounded-2xl border border-ink/10 bg-white p-8 text-center shadow-sm">
            {!result ? (
              <>
                <ShieldX size={48} className="mx-auto text-ink-soft/50" />
                <h1 className="mt-4 font-display text-2xl font-bold text-ink">Certificate not found</h1>
                <p className="mt-2 text-sm text-ink-soft">We couldn&apos;t find a certificate for this link.</p>
              </>
            ) : valid ? (
              <>
                <BadgeCheck size={48} className="mx-auto text-olive" />
                <h1 className="mt-4 font-display text-2xl font-bold text-ink">Verified certificate</h1>
                <p className="mt-1 text-sm text-ink-soft">This certificate is genuine and valid.</p>
                <dl className="mt-6 space-y-3 text-left">
                  <Row label="Recipient" value={result.recipientName} />
                  <Row label="Course" value={result.courseTitle} />
                  <Row label="Issued" value={fmtDate(result.issuedAt)} />
                  <Row label="Certificate ID" value={result.certificateId} />
                </dl>
              </>
            ) : (
              <>
                <ShieldX size={48} className="mx-auto text-red-500" />
                <h1 className="mt-4 font-display text-2xl font-bold text-ink">Certificate revoked</h1>
                <p className="mt-2 text-sm text-ink-soft">
                  This certificate ({result.certificateId}) is no longer valid.
                </p>
              </>
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-ink/5 pb-2">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</dt>
      <dd className="text-right text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}
