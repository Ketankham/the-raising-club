import { Logo } from "@/components/logo";
import { getReviewInvitationInfo } from "@/lib/reviews";
import { ReviewForm } from "@/components/reviews/review-form";

/** Public, account-free review submission via a caregiver's invite link. */
export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const info = await getReviewInvitationInfo(token);

  return (
    <div className="flex min-h-screen flex-col items-center bg-cream px-4 py-10">
      <Logo />
      <div className="mt-8 w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5">
        {info.valid ? (
          <ReviewForm
            token={token}
            caregiverName={info.caregiverName ?? "this caregiver"}
            inviteeName={info.inviteeName ?? ""}
            relationship={info.relationship ?? ""}
          />
        ) : (
          <div className="text-center">
            <h1 className="font-display text-xl font-bold text-ink">This review link isn&rsquo;t available</h1>
            <p className="mt-2 text-ink-soft">It may have expired or already been used. Ask the caregiver to send a fresh invite.</p>
          </div>
        )}
      </div>
    </div>
  );
}
