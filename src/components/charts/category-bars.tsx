import { formatBRL } from "@/lib/format";

export type CatDatum = { name: string; value: number; color: string };

export default function CategoryBars({
  data,
  max,
}: {
  data: CatDatum[];
  max?: number;
}) {
  if (data.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-ink-muted">
        Nenhum item categorizado neste período.
      </p>
    );
  }
  const top = Math.max(max ?? 0, ...data.map((d) => d.value)) || 1;

  return (
    <ul className="space-y-2.5">
      {data.map((d) => (
        <li key={d.name}>
          <div className="mb-1 flex items-baseline justify-between text-sm">
            <span className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: d.color }}
              />
              {d.name}
            </span>
            <span className="font-medium tabular-nums">
              {formatBRL(d.value)}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full"
              style={{
                width: `${(d.value / top) * 100}%`,
                background: d.color,
              }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}
