import Link from "next/link";
import {
  ArrowRight,
  ShoppingCart,
  ListPlus,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import {
  getFlatItems,
  getMonthlyTotals,
  getProfileName,
  getPurchasesWithTotals,
} from "@/lib/queries";
import {
  formatBRL,
  formatLongDate,
  formatMonthLabel,
  toMonthKey,
} from "@/lib/format";
import { colorFor } from "@/lib/colors";
import MonthlyBarChart from "@/components/charts/monthly-bar-chart";
import CategoryBars, { type CatDatum } from "@/components/charts/category-bars";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [name, monthly, items, recent] = await Promise.all([
    getProfileName(supabase),
    getMonthlyTotals(supabase, 12),
    getFlatItems(supabase, 2),
    getPurchasesWithTotals(supabase, 5),
  ]);

  const now = new Date();
  const thisKey = toMonthKey(now);
  const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const prevKey = toMonthKey(prev);

  const thisMonth = monthly.find((m) => m.month === thisKey);
  const prevMonth = monthly.find((m) => m.month === prevKey);
  const thisTotal = thisMonth?.total ?? 0;
  const prevTotal = prevMonth?.total ?? 0;
  const delta =
    prevTotal > 0 ? ((thisTotal - prevTotal) / prevTotal) * 100 : null;

  // top categorias do mês atual
  const catMap = new Map<string, CatDatum>();
  for (const it of items) {
    if (it.month !== thisKey) continue;
    const key = it.category ?? "Sem categoria";
    const entry =
      catMap.get(key) ??
      ({
        name: key,
        value: 0,
        color: it.category_color ?? colorFor(key),
      } as CatDatum);
    entry.value += it.total;
    catMap.set(key, entry);
  }
  const topCats = [...catMap.values()]
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <div className="space-y-6 p-4">
      <header className="flex items-center justify-between pt-2">
        <div>
          <p className="text-sm text-ink-muted">Olá{name ? `, ${name}` : ""} 👋</p>
          <h1 className="text-xl font-bold tracking-tight">Suas compras</h1>
        </div>
        <Link
          href="/ajustes"
          className="rounded-full border border-line px-3 py-1.5 text-xs text-ink-muted"
        >
          Ajustes
        </Link>
      </header>

      {/* Card do mês */}
      <div className="card">
        <p className="text-sm text-ink-muted">
          {formatMonthLabel(thisKey)}
        </p>
        <p className="mt-1 text-4xl font-bold tracking-tight">
          {formatBRL(thisTotal)}
        </p>
        <div className="mt-2 flex items-center gap-3 text-sm">
          {delta === null ? (
            <span className="text-ink-muted">
              {thisMonth?.purchases ?? 0}{" "}
              {(thisMonth?.purchases ?? 0) === 1 ? "compra" : "compras"}
            </span>
          ) : (
            <span
              className={`flex items-center gap-1 ${
                delta > 0 ? "text-negative" : "text-positive"
              }`}
            >
              {delta > 0 ? (
                <TrendingUp className="h-4 w-4" />
              ) : (
                <TrendingDown className="h-4 w-4" />
              )}
              {delta > 0 ? "+" : ""}
              {delta.toFixed(0)}% vs {formatMonthLabel(prevKey)}
            </span>
          )}
        </div>
        <div className="mt-4">
          <MonthlyBarChart data={monthly} height={180} />
        </div>
        <Link
          href="/graficos"
          className="mt-2 flex items-center justify-center gap-1 text-sm text-accent"
        >
          Ver gráficos <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Ações rápidas */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/compras/nova" className="card flex flex-col gap-2 active:bg-surface-2">
          <ShoppingCart className="h-5 w-5 text-accent" />
          <span className="font-medium">Nova compra</span>
          <span className="text-xs text-ink-muted">Registrar ida ao mercado</span>
        </Link>
        <Link href="/listas" className="card flex flex-col gap-2 active:bg-surface-2">
          <ListPlus className="h-5 w-5 text-accent" />
          <span className="font-medium">Gerar lista</span>
          <span className="text-xs text-ink-muted">A partir de um modelo</span>
        </Link>
      </div>

      {/* Top categorias */}
      <section className="card">
        <h2 className="mb-3 text-sm font-semibold text-ink-muted">
          Categorias em {formatMonthLabel(thisKey)}
        </h2>
        <CategoryBars data={topCats} />
      </section>

      {/* Últimas compras */}
      <section>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-ink-muted">
            Últimas compras
          </h2>
          <Link href="/compras" className="text-sm text-accent">
            Ver todas
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
            Nenhuma compra ainda.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/compras/${p.id}`}
                  className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 last:border-b-0 active:bg-surface-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {formatLongDate(p.purchase_date)}
                    </p>
                    <p className="truncate text-xs text-ink-muted">
                      {p.market?.name ?? "Sem mercado"} · {p.itemCount}{" "}
                      {p.itemCount === 1 ? "item" : "itens"}
                    </p>
                  </div>
                  <span className="shrink-0 font-bold">
                    {formatBRL(p.total)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
