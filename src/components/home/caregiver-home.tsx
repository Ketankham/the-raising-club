import Link from "next/link";
import { Star, ShieldCheck, UserRound } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { AppHeader } from "@/components/app/app-header";
import { PageWrap, Greeting, LaneCard, Panel } from "./home-ui";

export async function CaregiverHome({ userId, name }: { userId: string; name: string }) {
  const supabase = await createClient();
  const { data: cg } = await supabase
    .from("caregiver_profiles")
    .select("looking_for_paid_work, is_published")
    .eq("user_id", userId)
    .maybeSingle();

  const jobSeeking = cg?.looking_for_paid_work ?? false;

  return (
    <div className="min-h-screen bg-cream">
      <AppHeader name={name} nav={[{ href: "/profile", label: "My profile" }, { href: "/connect", label: "Connect" }, { href: "/events", label: "Events" }, { href: "/courses", label: "Learn" }]} />
      <PageWrap>
        <Greeting name={name} sub="However you're connected to children, there's a place for you here." />

        <div className="grid gap-4 sm:grid-cols-3">
          <LaneCard href="/profile" emoji="🪪" title="My profile" body={cg?.is_published ? "Your profile is visible to families and programs." : "Your profile is private. Publish it when you're ready."} tone="lavender" />
          <LaneCard href="/connect" emoji="🔗" title="Connect" body="Community, playdates, meetups, and—if you want—paid roles." tone="cream" />
          <LaneCard href="/courses" emoji="📚" title="Learn & grow" body="Short trainings designed for real caregiving life." tone="sage" />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <Panel title="Strengthen your profile">
            <p className="mb-4 text-sm text-ink-soft">
              A few optional steps help families and programs feel confident working with you.
            </p>
            <div className="space-y-3">
              <Link href="/profile/reviews/invite" className="flex items-start gap-3 rounded-xl border border-ink/10 p-4 transition hover:bg-cream">
                <Star className="mt-0.5 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-medium text-ink">Invite a review</span>
                  <span className="text-sm text-ink-soft">Ask a past family or employer to share a short review.</span>
                </span>
              </Link>
              <Link href="/profile/verification" className="flex items-start gap-3 rounded-xl border border-ink/10 p-4 transition hover:bg-cream">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-primary" />
                <span>
                  <span className="block font-medium text-ink">Verification &amp; background check</span>
                  <span className="text-sm text-ink-soft">Optional, but may be required for some program roles.</span>
                </span>
              </Link>
            </div>
          </Panel>

          <Panel title={jobSeeking ? "Opportunities" : "Your community"} action={<Link href="/profile" className="text-sm font-medium text-primary hover:underline">View profile</Link>}>
            <div className="flex items-start gap-3 rounded-xl bg-cream p-4">
              <UserRound className="mt-0.5 h-5 w-5 text-ink-soft" />
              <p className="text-sm text-ink-soft">
                {jobSeeking
                  ? "You're set up to apply to family and program roles. Browse roles in Connect."
                  : "You're set up for community, events, and learning. You can switch on job search anytime from your profile."}
              </p>
            </div>
          </Panel>
        </div>
      </PageWrap>
    </div>
  );
}
