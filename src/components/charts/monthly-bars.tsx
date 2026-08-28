"use client";

import { formatBRL, formatMonthLabel, formatMonthShort } from "@/lib/format";

export type MonthDatum = {
  month: string; // "YYYY-MM"
  total: number;
  purchases?: number;
};

function compact(v: number): string {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(Math.round(v));
}

/**
 * Gráfico de barras por mês, feito à mão (sem lib) para ficar alinhado e leve.
 * Se `selected`/`onToggle` forem passados, cada mês vira clicável (fixar/soltar).
 */
export default function MonthlyBars({
  data,
  height = 210,
  selected,
  onToggle,
  showValues,
}: {
  data: MonthDatum[];
  height?: number;
  selected?: string[];
  onToggle?: (month: string) => void;
  showValues?: boolean;
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink-muted">Sem dados ainda.</p>
    );
  }

  const interactive = !!onToggle;
  const sel = new Set(selected ?? []);
  const values = data.map((d) => d.total);
  const max = Math.max(...values, 1);
  const scaleMax = max * 1.2;
  const avg = values.reduce((s, v) => s + v, 0) / values.length;
  const showLabels = showValues ?? data.length <= 15;

  const gridVals = [scaleMax, scaleMax / 2, 0];
  const plotH = height - 34; // reserva p/ rótulo do mês

  return (
    <div className="w-full">
      <div className="relative" style={{ height }}>
        {/* linhas de grade */}
        <div
          className="pointer-events-none absolute inset-x-0"
          style={{ top: 0, height: plotH }}
        >
          {gridVals.map((v, i) => (
            <div
              key={i}
              className="absolute inset-x-0 flex items-center"
              style={{ top: `${(1 - v / scaleMax) * 100}%` }}
            >
              <span className="w-9 shrink-0 pr-1 text-right text-[11px] text-ink-muted">
                {v >= 1000 ? `${Math.round(v / 100) / 10}k` : Math.round(v)}
              </span>
              <div className="h-px flex-1 bg-line" />
            </div>
          ))}
          {/* média */}
          <div
            className="absolute inset-x-9 border-t border-dashed border-accent"
            style={{ top: `${(1 - avg / scaleMax) * 100}%` }}
          >
            <span className="absolute right-0 -top-4 rounded bg-bg px-1 text-[10px] font-medium text-ink-muted">
              méd {formatBRL(avg)}
            </span>
          </div>
        </div>

        {/* barras */}
        <div
          className="absolute inset-x-0 flex items-end gap-1 pl-9"
          style={{ top: 0, height: plotH }}
        >
          {data.map((d) => {
            const pct = (d.total / scaleMax) * 100;
            const isSel = sel.has(d.month);
            const dim = sel.size > 0 && !isSel;
            return (
              <button
                key={d.month}
                type="button"
                disabled={!interactive}
                onClick={() => onToggle?.(d.month)}
                className={`group relative flex h-full flex-1 flex-col justify-end ${
                  interactive ? "cursor-pointer" : "cursor-default"
                }`}
                title={`${formatMonthLabel(d.month)} · ${formatBRL(d.total)}`}
                aria-pressed={interactive ? isSel : undefined}
              >
                {(showLabels || isSel) && (
                  <span
                    className={`mb-1 text-center text-[11px] font-semibold tabular-nums ${
                      isSel
                        ? "text-accent"
                        : dim
                          ? "text-ink-faint"
                          : "text-ink-muted"
                    }`}
                  >
                    {compact(d.total)}
                  </span>
                )}
                <div
                  className={`w-full rounded-t-md transition-all ${
                    isSel
                      ? "bg-accent ring-2 ring-accent/40"
                      : dim
                        ? "bg-accent/30"
                        : "bg-accent/80 group-hover:bg-accent"
                  }`}
                  style={{ height: `${Math.max(pct, 2)}%` }}
                />
              </button>
            );
          })}
        </div>

        {/* rótulos dos meses */}
        <div
          className="absolute inset-x-0 flex gap-1 pl-9"
          style={{ top: plotH, height: 34 }}
        >
          {data.map((d) => {
            const isSel = sel.has(d.month);
            return (
              <button
                key={d.month}
                type="button"
                disabled={!interactive}
                onClick={() => onToggle?.(d.month)}
                className={`flex-1 pt-1 text-center text-[11px] leading-tight ${
                  isSel ? "font-semibold text-accent" : "text-ink-muted"
                } ${interactive ? "cursor-pointer" : "cursor-default"}`}
              >
                {formatMonthShort(d.month)}
              </button>
            );
          })}
        </div>
      </div>

      {interactive && (
        <p className="mt-2 text-center text-[11px] text-ink-muted">
          {sel.size === 0
            ? "Toque num mês para fixar e comparar"
            : `${sel.size} mês(es) fixado(s) — toque de novo para soltar`}
        </p>
      )}
    </div>
  );
}
