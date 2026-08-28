"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatBRL, formatMonthLabel, formatMonthShort } from "@/lib/format";
import { CHART_AXIS } from "@/lib/colors";

type Datum = { month: string; total: number };

export default function MonthlyBarChart({
  data,
  height = 200,
  highlightLast = true,
}: {
  data: Datum[];
  height?: number;
  highlightLast?: boolean;
}) {
  if (data.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-ink-muted">
        Sem dados ainda.
      </p>
    );
  }

  const lastMonth = data[data.length - 1]?.month;

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, bottom: 0, left: -16 }}>
          <XAxis
            dataKey="month"
            tickFormatter={formatMonthShort}
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            tickFormatter={(v: number) =>
              v >= 1000 ? `${Math.round(v / 100) / 10}k` : String(v)
            }
            tick={{ fill: CHART_AXIS, fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={44}
          />
          <Tooltip
            cursor={{ fill: "#ffffff10" }}
            contentStyle={{
              background: "#1b1b20",
              border: "1px solid #26262c",
              borderRadius: 12,
              fontSize: 13,
            }}
            labelStyle={{ color: "#a1a1aa" }}
            labelFormatter={(m: string) => formatMonthLabel(m)}
            formatter={(v: number) => [formatBRL(v), "Total"]}
          />
          <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={44}>
            {data.map((d) => (
              <Cell
                key={d.month}
                fill={
                  highlightLast && d.month === lastMonth ? "#3b82f6" : "#3b82f660"
                }
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
