"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Search } from "lucide-react";
import type { FlatItem } from "@/lib/types";
import {
  formatBRL,
  formatLongDate,
  formatMonthLabel,
  formatMonthShort,
} from "@/lib/format";
import { colorFor, CHART_AXIS, CHART_GRID } from "@/lib/colors";
import CategoryBars, { type CatDatum } from "@/components/charts/category-bars";

export default function GraficosClient({
  items,
  months,
}: {
  items: FlatItem[];
  months: string[]; // asc
}) {
  const desc = [...months].reverse();

  /* ------------------------- Comparar meses ------------------------- */
  const [monthA, setMonthA] = useState(desc[0] ?? "");
  const [monthB, setMonthB] = useState(desc[1] ?? desc[0] ?? "");

  const compare = useMemo(() => {
    const build = (m: string) => {
      const rows = items.filter((i) => i.month === m);
      const total = rows.reduce((s, i) => s + i.total, 0);
      const byCat = new Map<string, number>();
      for (const i of rows) {
        const k = i.category ?? "Sem categoria";
        byCat.set(k, (byCat.get(k) ?? 0) + i.total);
      }
      return { total, byCat, count: rows.length };
    };
    const a = build(monthA);
    const b = build(monthB);
    const cats = new Set([...a.byCat.keys(), ...b.byCat.keys()]);
    const catRows = [...cats]
      .map((name) => ({
        name,
        a: a.byCat.get(name) ?? 0,
        b: b.byCat.get(name) ?? 0,
      }))
      .sort((x, y) => y.a + y.b - (x.a + x.b));
    return { a, b, catRows };
  }, [items, monthA, monthB]);

  const deltaPct =
    compare.b.total > 0
      ? ((compare.a.total - compare.b.total) / compare.b.total) * 100
      : null;

  /* --------------------- Produto ao longo do tempo --------------------- */
  const [query, setQuery] = useState("");
  const product = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return null;
    const rows = items
      .filter((i) => i.name.toLowerCase().includes(q))
      .slice()
      .sort((x, y) => x.date.localeCompare(y.date));
    if (rows.length === 0) return { rows, prices: [], stats: null };
    const prices = rows.map((r) => ({
      date: r.date,
      preco: r.unit_price,
      label: r.name,
      market: r.market,
    }));
    const values = rows.map((r) => r.unit_price).filter((v) => v > 0);
    const spent = rows.reduce((s, r) => s + r.total, 0);
    const stats = {
      count: rows.length,
      avg: values.length ? values.reduce((s, v) => s + v, 0) / values.length : 0,
      min: values.length ? Math.min(...values) : 0,
      max: values.length ? Math.max(...values) : 0,
      spent,
      first: rows[0].date,
      last: rows[rows.length - 1].date,
    };
    return { rows, prices, stats };
  }, [items, query]);

  /* ----------------------- Categorias no período ----------------------- */
  const [range, setRange] = useState(6);
  const catPeriod = useMemo(() => {
    const cutoff = desc[range - 1] ?? desc[desc.length - 1] ?? "";
    const map = new Map<string, CatDatum>();
    for (const i of items) {
      if (cutoff && i.month < cutoff) continue;
      const k = i.category ?? "Sem categoria";
      const e =
        map.get(k) ??
        ({ name: k, value: 0, color: i.category_color ?? colorFor(k) } as CatDatum);
      e.value += i.total;
      map.set(k, e);
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  }, [items, range, desc]);

  return (
    <div className="space-y-6">
      {/* Comparar meses */}
      <section className="card">
        <h2 className="text-sm font-semibold text-ink-muted">
          Comparar dois meses
        </h2>
        <div className="mt-3 flex gap-2">
          <select
            value={monthA}
            onChange={(e) => setMonthA(e.target.value)}
            className="input flex-1"
          >
            {desc.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
          <span className="self-center text-ink-faint">vs</span>
          <select
            value={monthB}
            onChange={(e) => setMonthB(e.target.value)}
            className="input flex-1"
          >
            {desc.map((m) => (
              <option key={m} value={m}>
                {formatMonthLabel(m)}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-center">
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="text-xs text-ink-muted">
              {formatMonthLabel(monthA)}
            </p>
            <p className="mt-1 text-lg font-bold">{formatBRL(compare.a.total)}</p>
            <p className="text-xs text-ink-faint">{compare.a.count} itens</p>
          </div>
          <div className="rounded-xl bg-surface-2 p-3">
            <p className="text-xs text-ink-muted">
              {formatMonthLabel(monthB)}
            </p>
            <p className="mt-1 text-lg font-bold">{formatBRL(compare.b.total)}</p>
            <p className="text-xs text-ink-faint">{compare.b.count} itens</p>
          </div>
        </div>

        {deltaPct !== null && (
          <p
            className={`mt-2 text-center text-sm font-medium ${
              compare.a.total > compare.b.total
                ? "text-negative"
                : "text-positive"
            }`}
          >
            {compare.a.total > compare.b.total ? "+" : ""}
            {deltaPct.toFixed(0)}% ({formatBRL(compare.a.total - compare.b.total)})
          </p>
        )}

        {compare.catRows.length > 0 && (
          <div className="mt-4 space-y-2">
            <div className="flex justify-between text-xs text-ink-faint">
              <span>Categoria</span>
              <span className="flex gap-4">
                <span className="w-16 text-right">
                  {formatMonthShort(monthA)}
                </span>
                <span className="w-16 text-right">
                  {formatMonthShort(monthB)}
                </span>
              </span>
            </div>
            {compare.catRows.map((r) => (
              <div
                key={r.name}
                className="flex items-center justify-between border-t border-line pt-2 text-sm"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: colorFor(r.name) }}
                  />
                  {r.name}
                </span>
                <span className="flex gap-4 tabular-nums">
                  <span className="w-16 text-right">{formatBRL(r.a)}</span>
                  <span className="w-16 text-right text-ink-muted">
                    {formatBRL(r.b)}
                  </span>
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Produto ao longo do tempo */}
      <section className="card">
        <h2 className="text-sm font-semibold text-ink-muted">
          Produto ao longo do tempo
        </h2>
        <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3">
          <Search className="h-4 w-4 shrink-0 text-ink-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ex.: café, sabão, refri…"
            className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-ink-faint"
          />
        </div>

        {product === null ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            Digite ao menos 2 letras do nome do produto.
          </p>
        ) : product.rows.length === 0 ? (
          <p className="py-6 text-center text-sm text-ink-muted">
            Nada encontrado para “{query}”.
          </p>
        ) : (
          <>
            <div className="mt-4" style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={product.prices}
                  margin={{ top: 8, right: 8, bottom: 0, left: -12 }}
                >
                  <CartesianGrid stroke={CHART_GRID} vertical={false} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(d: string) =>
                      formatMonthShort(d.slice(0, 7))
                    }
                    tick={{ fill: CHART_AXIS, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fill: CHART_AXIS, fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    width={44}
                    tickFormatter={(v: number) => `R$${v.toFixed(0)}`}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1b1b20",
                      border: "1px solid #26262c",
                      borderRadius: 12,
                      fontSize: 13,
                    }}
                    labelStyle={{ color: "#a1a1aa" }}
                    formatter={(v: number) => [formatBRL(v), "Preço unitário"]}
                    labelFormatter={(d: string) => formatLongDate(d)}
                  />
                  <Line
                    type="monotone"
                    dataKey="preco"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3, fill: "#3b82f6" }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {product.stats && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <Stat label="Preço médio" value={formatBRL(product.stats.avg)} />
                <Stat label="Menor" value={formatBRL(product.stats.min)} />
                <Stat label="Maior" value={formatBRL(product.stats.max)} />
                <Stat
                  label="Compras"
                  value={String(product.stats.count)}
                />
                <Stat
                  label="Total gasto"
                  value={formatBRL(product.stats.spent)}
                />
                <Stat
                  label="Variação"
                  value={
                    product.stats.min > 0
                      ? `${(
                          ((product.stats.max - product.stats.min) /
                            product.stats.min) *
                          100
                        ).toFixed(0)}%`
                      : "—"
                  }
                />
              </div>
            )}
          </>
        )}
      </section>

      {/* Categorias no período */}
      <section className="card">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-muted">
            Gastos por categoria
          </h2>
          <select
            value={range}
            onChange={(e) => setRange(Number(e.target.value))}
            className="rounded-lg border border-line bg-surface-2 px-2 py-1 text-xs"
          >
            <option value={3}>3 meses</option>
            <option value={6}>6 meses</option>
            <option value={12}>12 meses</option>
            <option value={24}>24 meses</option>
          </select>
        </div>
        <div className="mt-3">
          <CategoryBars data={catPeriod} />
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-2 p-2.5">
      <p className="text-[11px] text-ink-muted">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
