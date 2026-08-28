"use client";

import type { Unit } from "@/lib/format";

const UNITS: { v: Unit; l: string }[] = [
  { v: "un", l: "Un" },
  { v: "kg", l: "Kg" },
  { v: "g", l: "g" },
];

export default function UnitPicker({
  value,
  onChange,
  name,
  className = "",
}: {
  value: Unit;
  onChange: (u: Unit) => void;
  name?: string;
  className?: string;
}) {
  return (
    <div
      className={`inline-flex shrink-0 rounded-lg border border-line bg-surface-2 p-0.5 text-xs ${className}`}
    >
      {name && <input type="hidden" name={name} value={value} />}
      {UNITS.map((u) => (
        <button
          key={u.v}
          type="button"
          onClick={() => onChange(u.v)}
          aria-pressed={value === u.v}
          className={`rounded-md px-2 py-1 font-medium transition ${
            value === u.v ? "bg-accent text-accent-ink" : "text-ink-muted"
          }`}
        >
          {u.l}
        </button>
      ))}
    </div>
  );
}

/** Converte um valor de exibição de uma unidade para outra. */
export function convertAmount(val: number, from: Unit, to: Unit): number {
  const kg = from === "g" ? val / 1000 : val;
  if (to === "g") return Math.round(kg * 1000);
  if (to === "un") return Math.max(1, Math.round(kg));
  return kg;
}
