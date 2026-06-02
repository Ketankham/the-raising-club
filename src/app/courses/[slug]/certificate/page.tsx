import { redirect } from "next/navigation";
import { headers } from "next/headers";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import QRCode from "qrcode";
import { getMyCertificate } from "@/lib/courses/learner-queries";
import { CertificateCard } from "@/components/courses/certificate-card";
import { CertificateActions } from "@/components/courses/certificate-actions";

export default async function CertificatePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cert = await getMyCertificate(slug);
  // No certificate yet → send them back to the course.
  if (!cert) redirect(`/courses/${slug}`);

  const h = await headers();
  const host = h.get("host") ?? "theraisingclub.com";
  const proto = h.get("x-forwarded-proto") ?? "https";
  const verifyUrl = `${proto}://${host}/verify/${cert.verifyToken}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });

  return (
    <main className="min-h-screen bg-cream/30">
      <div className="mx-auto max-w-4xl px-5 py-8">
        <div className="mb-4 flex items-center justify-between print:hidden">
          <Link href={`/courses/${slug}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
            <ArrowLeft size={16} /> Back to course
          </Link>
          <CertificateActions verifyUrl={verifyUrl} certificateId={cert.certificateId} />
        </div>
        <CertificateCard cert={cert} qrDataUrl={qrDataUrl} verifyHost={host} />
      </div>
    </main>
  );
}
