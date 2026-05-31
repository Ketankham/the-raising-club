"use client";

import { useState, useTransition } from "react";
import { Star, Copy, Check, X, Mail } from "lucide-react";
import type { CaregiverReviewsData } from "@/lib/reviews";
import { inviteReview, publishReview, declineReview } from "@/lib/reviews-actions";

function Stars({ n }: { n: number | null }) {
  return (
    <span className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < (n ?? 0) ? "fill-[#e0a72e] text-[#e0a72e]" : "text-ink/15"}`} />
      ))}
    </span>
  );
}

export function ReviewsManager({ data }: { data: CaregiverReviewsData }) {
  const [pending, start] = useTransition();
  const [toast, setToast] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [rel, setRel] = useState("");
  const [email, setEmail] = useState("");
  const show = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3000); };
  const inputCls = "rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-ink outline-none focus:border-primary";

  function invite() {
    start(async () => {
      const r = await inviteReview({ name, relationship: rel, email });
      if (!r.ok) return show(r.error);
      setName(""); setRel(""); setEmail("");
      await navigator.clipboard?.writeText(`${window.location.origin}${new URL(r.data!.link, window.location.origin).pathname}`).catch(() => {});
      show("Invite created — link copied to clipboard");
    });
  }
  const copyInvite = (token: string) =>
    navigator.clipboard?.writeText(`${window.location.origin}/review/${token}`).then(() => show("Review link copied"));

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold text-ink">Reviews</h1>
      <p className="mt-1 text-ink-soft">Invite past families or employers to review you. You approve each one before it appears on your profile.</p>

      {/* INVITE */}
      <section className="mt-6 rounded-2xl border border-ink/8 bg-white p-6">
        <h2 className="mb-3 font-display text-lg font-semibold text-ink">Invite a review</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="Their name" />
          <input className={inputCls} value={rel} onChange={(e) => setRel(e.target.value)} placeholder="Relationship (family, employer…)" />
          <input className={inputCls} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" />
        </div>
        <button onClick={invite} disabled={pending || !name} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50">
          <Mail className="h-4 w-4" /> Create invite link
        </button>

        {data.invites.length > 0 && (
          <div className="mt-4 divide-y divide-ink/5 border-t border-ink/5">
            {data.invites.map((i) => (
              <div key={i.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="text-ink">{i.inviteeName} <span className="text-ink-soft">· awaiting review</span></span>
                <button onClick={() => copyInvite(i.token)} className="inline-flex items-center gap-1 text-ink-soft hover:text-ink"><Copy className="h-3.5 w-3.5" /> Copy link</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* PENDING REVIEWS */}
      {data.pending.length > 0 && (
        <section className="mt-6 rounded-2xl border border-ink/8 bg-white p-6">
          <h2 className="mb-4 font-display text-lg font-semibold text-ink">Awaiting your approval ({data.pending.length})</h2>
          <div className="space-y-4">
            {data.pending.map((r) => (
              <div key={r.id} className="rounded-xl border border-ink/8 bg-cream p-4">
                <div className="mb-1 flex items-center justify-between">
                  <Stars n={r.rating} />
                  <span className="text-xs text-ink-soft">{r.reviewerName ?? "A family"}{r.relationship ? `, ${r.relationship}` : ""}</span>
                </div>
                {r.body && <p className="text-sm text-ink">&ldquo;{r.body}&rdquo;</p>}
                <div className="mt-3 flex gap-2">
                  <button onClick={() => start(async () => { const x = await publishReview(r.id); show(x.ok ? "Published — now on your profile" : x.error); })} className="inline-flex items-center gap-1.5 rounded-full bg-olive/30 px-4 py-1.5 text-xs font-semibold text-[#4f6b15] hover:bg-olive/40"><Check className="h-3.5 w-3.5" /> Publish</button>
                  <button onClick={() => start(async () => { const x = await declineReview(r.id); show(x.ok ? "Declined" : x.error); })} className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-1.5 text-xs font-medium text-ink-soft hover:text-red-600"><X className="h-3.5 w-3.5" /> Decline</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* PUBLISHED */}
      <section className="mt-6 rounded-2xl border border-ink/8 bg-white p-6">
        <h2 className="mb-4 font-display text-lg font-semibold text-ink">Published ({data.published.length})</h2>
        {data.published.length ? (
          <div className="space-y-4">
            {data.published.map((r) => (
              <div key={r.id} className="rounded-xl border border-ink/8 p-4">
                <div className="mb-1 flex items-center justify-between">
                  <Stars n={r.rating} />
                  <button onClick={() => start(async () => { const x = await declineReview(r.id); show(x.ok ? "Hidden from profile" : x.error); })} className="text-xs text-ink-soft hover:text-red-600">Hide</button>
                </div>
                {r.body && <p className="text-sm text-ink">&ldquo;{r.body}&rdquo;</p>}
                <p className="mt-2 text-xs text-ink-soft">— {r.reviewerName ?? "A family"}{r.relationship ? `, ${r.relationship}` : ""}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-ink-soft">No published reviews yet. Invite someone above to get started.</p>
        )}
      </section>

      <div className={`fixed bottom-8 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink px-6 py-3 text-sm font-medium text-white shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "translate-y-16 opacity-0"}`}>{toast}</div>
    </div>
  );
}
