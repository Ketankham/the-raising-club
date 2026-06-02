"use client";

import { useState } from "react";
import { Share2, Download, Check, Loader2 } from "lucide-react";

export function CertificateActions({
  verifyUrl,
  certificateId,
}: {
  verifyUrl: string;
  certificateId: string;
}) {
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const share = async () => {
    try {
      if (navigator.share) {
        await navigator.share({ title: "My certificate", url: verifyUrl });
        return;
      }
    } catch {
      /* fall through to copy */
    }
    try {
      await navigator.clipboard.writeText(verifyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  // Rasterize the on-screen certificate at high resolution and save it as a
  // single-page PDF sized to the card — a true one-click download.
  const download = async () => {
    const el = document.getElementById("certificate-card");
    if (!el || downloading) return;
    setDownloading(true);
    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas-pro"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(el, {
        scale: 2,
        backgroundColor: "#fcf6ec",
        useCORS: true,
      });
      const orientation = canvas.width >= canvas.height ? "landscape" : "portrait";
      const pdf = new jsPDF({
        orientation,
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${certificateId}.pdf`);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex flex-wrap justify-end gap-2 print:hidden">
      <button
        onClick={share}
        className="inline-flex items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-cream"
      >
        {copied ? <Check size={15} className="text-olive" /> : <Share2 size={15} />}
        {copied ? "Link copied" : "Share"}
      </button>
      <button
        onClick={download}
        disabled={downloading}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90 disabled:opacity-60"
      >
        {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
        {downloading ? "Preparing…" : "Download Certificate (PDF)"}
      </button>
    </div>
  );
}
