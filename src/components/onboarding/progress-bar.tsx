/** Presentational progress header — "Step X of N" + a bar. */
export function StepProgress({ index, total }: { index: number; total: number }) {
  const percent = total > 0 ? Math.round((index / total) * 100) : 0;
  return (
    <div className="mb-8">
      <p className="mb-2 text-sm font-medium text-ink-soft">
        Step {index} of {total}
      </p>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full bg-ink/10"
        role="progressbar"
        aria-valuenow={index}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={`Step ${index} of ${total}`}
      >
        <div
          className="h-full rounded-full bg-primary transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
