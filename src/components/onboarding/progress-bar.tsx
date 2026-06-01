import { BackButton } from "./back-button";

/** Presentational progress header — back arrow + "Step X of N" + a green bar. */
export function StepProgress({ index, total }: { index: number; total: number }) {
  const percent = total > 0 ? Math.round((index / total) * 100) : 0;
  return (
    <div className="mb-10 flex items-center gap-4">
      <BackButton />
      <div className="flex-1">
        <p className="mb-2 text-sm font-semibold text-ink">
          Step {index} of {total}
        </p>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-ink/10"
          role="progressbar"
          aria-valuenow={index}
          aria-valuemin={1}
          aria-valuemax={total}
          aria-label={`Step ${index} of ${total}`}
        >
          <div
            className="h-full rounded-full bg-olive transition-all duration-300"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>
    </div>
  );
}
