"use client";

import { useState } from "react";

/** A number input that toggles between months and years.
 *  Always stores/returns the value in months. */
export function AgeInput({
  label,
  valueMonths,
  onChange,
  className,
}: {
  label: string;
  valueMonths: number | null;
  onChange: (months: number | null) => void;
  className?: string;
}) {
  const [unit, setUnit] = useState<"months" | "years">("months");

  const displayValue =
    valueMonths == null
      ? ""
      : unit === "years"
        ? String(Math.round(valueMonths / 12))
        : String(valueMonths);

  function handleChange(raw: string) {
    if (raw === "") { onChange(null); return; }
    const n = Number(raw);
    if (isNaN(n) || n < 0) return;
    onChange(unit === "years" ? Math.round(n * 12) : n);
  }

  function toggleUnit() {
    setUnit((u) => (u === "months" ? "years" : "months"));
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-ink-soft">{label}</label>
        <button
          type="button"
          onClick={toggleUnit}
          className="rounded-full border border-ink/15 px-2 py-0.5 text-[10px] font-semibold text-ink-soft transition hover:border-ink/30 hover:text-ink"
        >
          {unit === "months" ? "mo → yrs" : "yrs → mo"}
        </button>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min={0}
          value={displayValue}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={unit === "months" ? "months" : "years"}
          className={className}
        />
        <span className="shrink-0 text-xs text-ink-soft">{unit === "months" ? "mo" : "yrs"}</span>
      </div>
    </div>
  );
}
