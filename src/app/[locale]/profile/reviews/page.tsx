import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { redirect } from "next/navigation";
import { requireUserProfile } from "@/lib/guards";
import { getCaregiverReviews } from "@/lib/reviews";
import { ReviewsManager } from "@/components/reviews/reviews-manager";

export default async function ReviewsPage() {
  const { user, profile } = await requireUserProfile();
  if (profile.role !== "caregiver") redirect("/dashboard");

  const data = await getCaregiverReviews(user.id);

  return (
    <div className="min-h-screen bg-cream px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <Link href="/profile" className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-ink">
          <ArrowLeft size={16} /> Back to profile
        </Link>
      </div>
      <ReviewsManager data={data} />
    </div>
  );
}
