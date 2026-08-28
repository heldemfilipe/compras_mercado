"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, X } from "lucide-react";
import type { FlatItem, MonthlyTotal } from "@/lib/types";
import {
  formatBRL,
  formatLongDate,
  formatMonthLabel,
  formatMonthShort,
} from "@/lib/format";
import { colorFor } from "@/lib/colors";
import MonthlyBars from "@/components/charts/monthly-bars";
import MiniLine from "@/components/charts/mini-line";
import CategoryBars, { type CatDatum } from "@/components/charts/category-bars";

export default function GraficosClient({
  items,
  monthly,
}: {
  items: FlatItem[];
  monthly: MonthlyTotal[];
}) {
  const monthsDesc = [...monthly].map((m) => m.month).reverse();
  const avg =
    monthly.length > 0
      ? monthly.reduce((s, m) => s + m.total, 0) / monthly.length
      : 0;

  /* ---------------- meses fixados no gráfico ---------------- */
  const [pinned, setPinned] = useState<string[]>([]);
  const togglePin = (m: string) =>
    setPinned((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]));

  const catsForMonth = (m: string): CatDatum[] => {
    const map = new Map<string, CatDatum>();
    for (const it of items) {
      if (it.month !== m) continue;
      const k = it.category ?? "Sem categoria";
      const e =
        map.get(k) ??
        ({ name: k, value: 0, color: it.category_color ?? colorFor(k) } as CatDatum);
      e.value += it.total;
      map.set(k, e);
    }
    return [...map.values()].sort((a, b) => b.value - a.value);
  };

  const pinnedSorted = [...pinned].sort();
  const compareCats = useMemo(() => {
    if (pinnedSorted.length < 2) return [];
    const names = new Set<string>();
    const perMonth: Record<string, Map<string, number>> = {};
    for (const m of pinnedSorted) {
      perMonth[m] = new Map();
      for (const it of items) {
        if (it.month !== m) continue;
        const k = it.category ?? "Sem categoria";
        names.add(k);
        perMonth[m].set(k, (perMonth[m].get(k) ?? 0) + it.total);
      }
    }
    return [...names]
      .map((name) => ({
        name,
        color: colorFor(name),
        vals: pinnedSorted.map((m) => perMonth[m].get(name) ?? 0),
      }))
      .sort((a, b) => b.vals.reduce((s, v) => s + v, 0) - a.vals.reduce((s, v) => s + v, 0));
  }, [pinnedSorted, items]);

  /* ---------------- produto ao longo do tempo ---------------- */
  const [query, setQuery] = useState("");
  const [chosen, setChosen] = useState<string | null>(null);
  const norm = (s: string) =>
    s
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .trim();

  // lista de produtos distintos que casam com a busca
  const matches = useMemo(() => {
    const q = norm(query);
    if (q.length < 2) return [];
    const map = new Map<
      string,
      { name: string; count: number; last: number; lastDate: string }
    >();
    for (const it of items) {
      if (!norm(it.name).includes(q)) continue;
      const key = norm(it.name);
      const cur = map.get(key);
      if (!cur) {
        map.set(key, {
          name: it.name,
          count: 1,
          last: it.unit_price,
          lastDate: it.date,
        });
      } else {
        cur.count++;
        if (it.date > cur.lastDate) {
          cur.last = it.unit_price;
          cur.lastDate = it.date;
          cur.name = it.name;
        }
      }
    }
    return [...map.values()].sort(
      (a, b) => b.count - a.count || a.name.localeCompare(b.name, "pt-BR"),
    );
  }, [items, query]);

  const activeName = chosen ?? (matches.length === 1 ? matches[0].name : null);

  const product = useMemo(() => {
    if (!activeName) return null;
    const target = norm(activeName);
    const rows = items
      .filter((i) => norm(i.name) === target && i.unit_price > 0)
      .slice()
      .sort((a, b) => a.date.localeCompare(b.date));
    if (rows.length === 0) return { rows, points: [], stats: null };
    const points = rows.map((r) => ({ date: r.date, price: r.unit_price }));
    const values = rows.map((r) => r.unit_price);
    const spent = rows.reduce((s, r) => s + r.total, 0);
    return {
      rows,
      points,
      stats: {
        count: rows.length,
        avg: values.reduce((s, v) => s + v, 0) / values.length,
        min: Math.min(...values),
        max: Math.max(...values),
        spent,
      },
    };
  }, [items, activeName]);

  /* ---------------- categorias no período ---------------- */
  const [range, setRange] = useState(6);
  const catPeriod = useMemo(() => {
    const cutoff = monthsDesc[range - 1] ?? monthsDesc[monthsDesc.length - 1] ?? "";
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
  }, [items, range, monthsDesc]);

  const single = pinnedSorted.length === 1 ? pinnedSorted[0] : null;
  const singleIdx = single ? monthly.findIndex((m) => m.month === single) : -1;
  const singleRow = singleIdx >= 0 ? monthly[singleIdx] : null;
  const singlePrev = singleIdx > 0 ? monthly[singleIdx - 1] : null;

  return (
    <div className="space-y-6">
      {/* Gastos por mês (clicável) */}
      <section className="card">
        <div className="flex items-baseline justify-between">
          <h2 className="text-sm font-semibold text-ink-muted">Gastos por mês</h2>
          <span className="text-xs text-ink-muted">média {formatBRL(avg)}</span>
        </div>
        <div className="mt-3">
          <MonthlyBars
            data={monthly}
            height={230}
            selected={pinned}
            onToggle={togglePin}
          />
        </div>

        {pinned.length > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs text-ink-muted">
              {pinnedSorted.map((m) => formatMonthLabel(m)).join(" · ")}
            </span>
            <button
              onClick={() => setPinned([])}
              className="flex items-center gap-1 text-xs text-accent"
            >
              <X className="h-3 w-3" /> limpar
            </button>
          </div>
        )}

        {/* 1 mês fixado -> detalhe */}
        {single && singleRow && (
          <div className="mt-3 space-y-3 border-t border-line pt-3">
            <div className="flex items-end justify-between">
              <div>
                <p className="text-sm capitalize text-ink-muted">
                  {formatMonthLabel(single)}
                </p>
                <p className="text-2xl font-bold">{formatBRL(singleRow.total)}</p>
              </div>
              <div className="text-right text-xs">
                <p
                  className={
                    singleRow.total > avg ? "text-negative" : "text-positive"
                  }
                >
                  {singleRow.total > avg ? "+" : ""}
                  {(((singleRow.total - avg) / avg) * 100).toFixed(0)}% vs média
                </p>
                {singlePrev && (
                  <p className="text-ink-faint">
                    {singleRow.total > singlePrev.total ? "+" : ""}
                    {(
                      ((singleRow.total - singlePrev.total) /
                        (singlePrev.total || 1)) *
                      100
                    ).toFixed(0)}
                    % vs {formatMonthShort(singlePrev.month)}
                  </p>
                )}
                <p className="text-ink-faint">
                  {singleRow.purchases}{" "}
                  {singleRow.purchases === 1 ? "compra" : "compras"} ·{" "}
                  {singleRow.items} itens
                </p>
              </div>
            </div>
            <CategoryBars data={catsForMonth(single)} />
          </div>
        )}

        {/* 2+ meses -> comparação */}
        {pinnedSorted.length >= 2 && (
          <div className="mt-3 overflow-x-auto border-t border-line pt-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-ink-faint">
                  <th className="pb-2 text-left font-medium">Categoria</th>
                  {pinnedSorted.map((m) => (
                    <th
                      key={m}
                      className="pb-2 text-right font-medium capitalize"
                    >
                      {formatMonthShort(m)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-line font-semibold">
                  <td className="py-2">Total</td>
                  {pinnedSorted.map((m) => {
                    const r = monthly.find((x) => x.month === m);
                    return (
                      <td key={m} className="py-2 text-right tabular-nums">
                        {formatBRL(r?.total ?? 0)}
                      </td>
                    );
                  })}
                </tr>
                {compareCats.map((c) => (
                  <tr key={c.name} className="border-t border-line">
                    <td className="py-1.5">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: c.color }}
                        />
                        {c.name}
                      </span>
                    </td>
                    {c.vals.map((v, i) => (
                      <td
                        key={i}
                        className="py-1.5 text-right tabular-nums text-ink-muted"
                      >
                        {v > 0 ? formatBRL(v) : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Produto ao longo do tempo */}
      <section className="card">
        <h2 className="text-sm font-semibold text-ink-muted">
          Produto ao longo do tempo
        </h2>

        {activeName ? (
          <div className="mt-3 flex items-center justify-between gap-2">
            <span className="min-w-0 truncate rounded-lg border border-accent/40 bg-accent/10 px-2.5 py-1 text-sm font-medium text-ink">
              {activeName}
            </span>
            <button
              onClick={() => {
                setChosen(null);
                setQuery("");
              }}
              className="flex shrink-0 items-center gap-1 text-xs text-accent"
            >
              <X className="h-3 w-3" /> nova busca
            </button>
          </div>
        ) : (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-line bg-surface-2 px-3">
            <Search className="h-4 w-4 shrink-0 text-ink-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: café, sabão, leite…"
              className="w-full bg-transparent py-2.5 text-[15px] outline-none placeholder:text-ink-faint"
            />
          </div>
        )}

        {!activeName && norm(query).length < 2 && (
          <p className="py-6 text-center text-sm text-ink-muted">
            Digite ao menos 2 letras para ver os produtos.
          </p>
        )}

        {!activeName && norm(query).length >= 2 && matches.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-muted">
            Nenhum produto com “{query}”.
          </p>
        )}

        {!activeName && matches.length > 0 && (
          <>
            <p className="mt-3 px-1 text-xs text-ink-faint">
              {matches.length} produto(s) — toque para ver o histórico
            </p>
            <ul className="mt-1.5 overflow-hidden rounded-xl border border-line">
              {matches.map((m) => (
                <li key={m.name}>
                  <button
                    onClick={() => setChosen(m.name)}
                    className="flex w-full items-center gap-2 border-b border-line px-3 py-2.5 text-left text-sm last:border-b-0 active:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1 truncate">{m.name}</span>
                    <span className="shrink-0 text-xs text-ink-faint">
                      {m.count}× · {formatBRL(m.last)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}

        {product && product.rows.length === 0 && (
          <p className="py-6 text-center text-sm text-ink-muted">
            “{activeName}” ainda não tem preço registrado.
          </p>
        )}

        {product && product.rows.length > 0 && (
          <>
            <div className="mt-4">
              <MiniLine points={product.points} />
            </div>
            {product.stats && (
              <div className="mt-3 grid grid-cols-3 gap-2 text-center text-sm">
                <Stat label="Preço médio" value={formatBRL(product.stats.avg)} />
                <Stat label="Menor" value={formatBRL(product.stats.min)} />
                <Stat label="Maior" value={formatBRL(product.stats.max)} />
                <Stat label="Compras" value={String(product.stats.count)} />
                <Stat label="Total gasto" value={formatBRL(product.stats.spent)} />
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
            <p className="mt-2 text-center text-xs text-ink-faint">
              {product.rows.length} lançamento(s) ·{" "}
              {formatLongDate(product.rows[0].date)} →{" "}
              {formatLongDate(product.rows[product.rows.length - 1].date)}
            </p>
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

      {/* Lista de meses */}
      <section className="card">
        <h2 className="mb-2 text-sm font-semibold text-ink-muted">
          Todos os meses
        </h2>
        <ul className="divide-y divide-line text-sm">
          {[...monthly].reverse().map((m) => {
            const isSel = pinned.includes(m.month);
            return (
              <li key={m.month}>
                <button
                  onClick={() => togglePin(m.month)}
                  className="flex w-full items-center justify-between py-2 text-left"
                >
                  <span
                    className={`capitalize ${
                      isSel ? "font-semibold text-accent" : "text-ink-muted"
                    }`}
                  >
                    {formatMonthLabel(m.month)}
                  </span>
                  <span className="font-medium tabular-nums">
                    {formatBRL(m.total)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
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
