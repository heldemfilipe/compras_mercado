import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getFlatItems, getMonthlyTotals } from "@/lib/queries";
import { formatBRL, formatMonthLabel } from "@/lib/format";
import MonthlyBarChart from "@/components/charts/monthly-bar-chart";
import GraficosClient from "./graficos-client";

export const metadata: Metadata = { title: "Gráficos" };

export default async function GraficosPage() {
  const supabase = await createClient();
  const [items, monthly] = await Promise.all([
    getFlatItems(supabase, 24),
    getMonthlyTotals(supabase, 24),
  ]);

  const months = monthly.map((m) => m.month);
  const avg =
    monthly.length > 0
      ? monthly.reduce((s, m) => s + m.total, 0) / monthly.length
      : 0;

  return (
    <>
      <PageHeader title="Gráficos" />

      <div className="space-y-6 p-4">
        {items.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" />}
            title="Ainda não há dados"
            description="Registre algumas compras com itens para ver a evolução dos gastos aqui."
          />
        ) : (
          <>
            <section className="card">
              <div className="flex items-baseline justify-between">
                <h2 className="text-sm font-semibold text-ink-muted">
                  Gastos por mês
                </h2>
                <span className="text-xs text-ink-faint">
                  média {formatBRL(avg)}
                </span>
              </div>
              <div className="mt-3">
                <MonthlyBarChart data={monthly} height={220} highlightLast />
              </div>
              <ul className="mt-3 divide-y divide-line text-sm">
                {[...monthly].reverse().map((m) => (
                  <li
                    key={m.month}
                    className="flex items-center justify-between py-2"
                  >
                    <span className="text-ink-muted">
                      {formatMonthLabel(m.month)}
                    </span>
                    <span className="font-medium tabular-nums">
                      {formatBRL(m.total)}
                    </span>
                  </li>
                ))}
              </ul>
            </section>

            <GraficosClient items={items} months={months} />
          </>
        )}
      </div>
    </>
  );
}
