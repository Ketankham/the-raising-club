"use client";

import { useState } from "react";
import { Share2, Download, Check } from "lucide-react";

export function CertificateActions({ verifyUrl }: { verifyUrl: string }) {
  const [copied, setCopied] = useState(false);

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
        onClick={() => window.print()}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90"
      >
        <Download size={15} /> Download Certificate (PDF)
      </button>
    </div>
  );
}
