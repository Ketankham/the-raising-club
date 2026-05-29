/**
 * The Raising Club wordmark — three overlapping rounded petals
 * (orange / olive / purple) beside the "the RAISING CLUB" lockup,
 * matching the live site brand mark.
 */
export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`flex items-center gap-2 ${className}`}>
      <svg
        width="42"
        height="30"
        viewBox="0 0 42 30"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M11 4c5 0 9 4 9 10s-4 12-10 12S0 21 0 15 5 4 11 4Z"
          fill="none"
          stroke="#ED9A4E"
          strokeWidth="2.5"
        />
        <path
          d="M21 2c5 0 9 5 9 11s-3 13-9 13-9-6-9-12S15 2 21 2Z"
          fill="none"
          stroke="#9FBF4A"
          strokeWidth="2.5"
        />
        <path
          d="M31 4c5 0 10 4 10 10s-4 12-10 12-9-6-9-12 4-10 9-10Z"
          fill="none"
          stroke="#9B86D9"
          strokeWidth="2.5"
        />
      </svg>
      <span className="leading-none">
        <span className="block font-display text-[10px] font-medium italic text-ink/60">
          the
        </span>
        <span className="block font-display text-lg font-extrabold tracking-tight text-ink">
          RAISING CLUB
        </span>
      </span>
    </span>
  );
}
