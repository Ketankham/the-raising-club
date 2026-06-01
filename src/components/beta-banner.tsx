/**
 * Site-wide beta notice. Rendered by the root layout for signed-out (public)
 * visitors only, and only when the beta lock is active — see {@link isBetaLocked}.
 */
export function BetaBanner() {
  return (
    <div
      role="status"
      className="w-full bg-primary px-4 py-2 text-center text-sm font-medium text-cream"
    >
      <span aria-hidden className="mr-1.5">🧪</span>
      The Raising Club is in <span className="font-semibold">beta testing</span>{" "}
      — new sign-ups are paused for now while we put the finishing touches in
      place. Thanks for your patience!
    </div>
  );
}
