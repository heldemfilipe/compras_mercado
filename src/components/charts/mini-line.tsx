"use client";

import { formatBRL, formatMonthShort, parseISODate } from "@/lib/format";

export type LinePoint = { date: string; price: number };

/** Linha de evolução de preço, SVG puro. */
export default function MiniLine({
  points,
  height = 190,
}: {
  points: LinePoint[];
  height?: number;
}) {
  if (points.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-ink-muted">Sem dados.</p>
    );
  }

  const W = 600;
  const H = 200;
  const padL = 46;
  const padR = 12;
  const padT = 12;
  const padB = 26;

  const times = points.map((p) => parseISODate(p.date).getTime());
  const tMin = Math.min(...times);
  const tMax = Math.max(...times);
  const prices = points.map((p) => p.price);
  const pMin = Math.min(...prices);
  const pMax = Math.max(...prices);
  const pad = (pMax - pMin) * 0.15 || Math.max(pMax * 0.1, 1);
  const yMin = Math.max(0, pMin - pad);
  const yMax = pMax + pad;

  const x = (t: number) =>
    points.length === 1
      ? (W - padL - padR) / 2 + padL
      : padL + ((t - tMin) / (tMax - tMin || 1)) * (W - padL - padR);
  const y = (p: number) =>
    padT + (1 - (p - yMin) / (yMax - yMin || 1)) * (H - padT - padB);

  const coords = points.map((p) => ({
    cx: x(parseISODate(p.date).getTime()),
    cy: y(p.price),
    p,
  }));
  const path = coords.map((c, i) => `${i === 0 ? "M" : "L"}${c.cx},${c.cy}`).join(" ");

  const yTicks = [yMax, (yMax + yMin) / 2, yMin];

  return (
    <div style={{ height }}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-full w-full overflow-visible"
      >
        {yTicks.map((v, i) => (
          <g key={i}>
            <line
              x1={padL}
              x2={W - padR}
              y1={y(v)}
              y2={y(v)}
              stroke="#26262c"
              vectorEffect="non-scaling-stroke"
            />
            <text
              x={padL - 6}
              y={y(v) + 3}
              textAnchor="end"
              fontSize="11"
              fill="#71717a"
            >
              {`R$${v.toFixed(0)}`}
            </text>
          </g>
        ))}

        <path
          d={path}
          fill="none"
          stroke="#3b82f6"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {coords.map((c, i) => (
          <circle key={i} cx={c.cx} cy={c.cy} r="3.5" fill="#3b82f6">
            <title>{`${formatMonthShort(c.p.date.slice(0, 7))} · ${formatBRL(
              c.p.price,
            )}`}</title>
          </circle>
        ))}

        <text x={padL} y={H - 8} fontSize="11" fill="#71717a">
          {formatMonthShort(points[0].date.slice(0, 7))}
        </text>
        <text
          x={W - padR}
          y={H - 8}
          textAnchor="end"
          fontSize="11"
          fill="#71717a"
        >
          {formatMonthShort(points[points.length - 1].date.slice(0, 7))}
        </text>
      </svg>
    </div>
  );
}
