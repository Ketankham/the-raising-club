import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { acceptStaffInvitation } from "@/lib/org-team-actions";
import { Logo } from "@/components/logo";

/** Accept a staff invitation. Signed-in users join immediately; others are
 *  prompted to sign in or create an account, returning here afterward. */
export default async function AcceptStaffInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const next = `/invite/staff/${token}`;

  let error: string | null = null;
  if (user && !user.is_anonymous) {
    const res = await acceptStaffInvitation(token);
    if (res.ok) redirect("/organization");
    error = res.error;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-cream px-4 text-center">
      <Logo />
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-sm ring-1 ring-ink/5">
        <h1 className="font-display text-xl font-bold text-ink">You&rsquo;ve been invited to join a program</h1>
        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : (
          <p className="mt-3 text-sm text-ink-soft">Sign in or create an account to join your program&rsquo;s team on The Raising Club.</p>
        )}
        <div className="mt-6 flex flex-col gap-3">
          <Link href={`/sign-in?next=${encodeURIComponent(next)}`} className="rounded-lg bg-primary px-6 py-3 font-display font-semibold text-white transition hover:bg-primary-hover">Sign in to join</Link>
          <Link href="/onboarding" className="text-sm font-medium text-primary hover:underline">Create an account</Link>
        </div>
      </div>
    </div>
  );
}
