"use client";

import { useState, useTransition } from "react";
import { Star } from "lucide-react";
import { submitReviewByToken } from "@/lib/reviews-actions";

export function ReviewForm({
  token, caregiverName, inviteeName, relationship,
}: {
  token: string;
  caregiverName: string;
  inviteeName: string;
  relationship: string;
}) {
  const [pending, start] = useTransition();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [name, setName] = useState(inviteeName);
  const [rel, setRel] = useState(relationship);
  const [body, setBody] = useState("");
  const [done, setDone] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function submit() {
    setErr(null);
    if (!rating) return setErr("Please choose a star rating.");
    start(async () => {
      const r = await submitReviewByToken({ token, reviewerName: name, relationship: rel, rating, body });
      if (r.ok) setDone(true);
      else setErr(r.error);
    });
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-olive/30 text-2xl">💛</div>
        <h1 className="font-display text-xl font-bold text-ink">Thank you!</h1>
        <p className="mt-2 text-ink-soft">Your review has been sent to {caregiverName}. They&rsquo;ll review it before it appears on their profile.</p>
      </div>
    );
  }

  const inputCls = "w-full rounded-lg border border-ink/15 bg-white px-3 py-2.5 text-ink outline-none focus:border-primary";

  return (
    <div>
      <h1 className="font-display text-2xl font-bold text-ink">Leave a review for {caregiverName}</h1>
      <p className="mt-1 text-sm text-ink-soft">Your words help families and programs feel confident. It only takes a minute.</p>

      <div className="mt-6 flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-sm font-medium text-ink">Your rating</p>
          <div className="flex gap-1" onMouseLeave={() => setHover(0)}>
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onMouseEnter={() => setHover(n)} onClick={() => setRating(n)} aria-label={`${n} star${n > 1 ? "s" : ""}`}>
                <Star className={`h-8 w-8 transition ${n <= (hover || rating) ? "fill-[#e0a72e] text-[#e0a72e]" : "text-ink/20"}`} />
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Your name</span>
          <input className={inputCls} value={name} onChange={(e) => setName(e.target.value)} placeholder="First name or initials" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Your relationship</span>
          <input className={inputCls} value={rel} onChange={(e) => setRel(e.target.value)} placeholder="e.g. Family, Employer, Program director" />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">Your review</span>
          <textarea className={`${inputCls} min-h-[120px]`} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What was it like working with them? What stood out?" />
        </label>

        {err && <p className="text-sm text-red-600">{err}</p>}

        <button onClick={submit} disabled={pending} className="rounded-full bg-primary px-6 py-3 font-display font-semibold text-white transition hover:bg-primary-hover disabled:opacity-50">
          {pending ? "Sending…" : "Submit review"}
        </button>
        <p className="text-center text-xs text-ink-soft">This review is private until {caregiverName} chooses to publish it.</p>
      </div>
    </div>
  );
}
