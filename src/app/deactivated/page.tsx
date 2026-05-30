import { SignOutButton } from "@/components/app/sign-out-button";

export default function DeactivatedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream px-4 text-center">
      <h1 className="font-display text-2xl font-bold text-ink">Your account is deactivated</h1>
      <p className="max-w-md text-ink-soft">
        Access to this account has been paused by an administrator. If you think this is a mistake,
        please contact support.
      </p>
      <SignOutButton />
    </div>
  );
}
