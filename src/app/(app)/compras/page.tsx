import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import Fab from "@/components/fab";
import { createClient } from "@/lib/supabase/server";
import { getPurchasesWithTotals, type PurchaseListRow } from "@/lib/queries";
import { formatBRL, formatLongDate, formatMonthLabel, toMonthKey } from "@/lib/format";

export const metadata: Metadata = { title: "Compras" };

export default async function ComprasPage() {
  const supabase = await createClient();
  const purchases = await getPurchasesWithTotals(supabase);

  const groups = new Map<string, PurchaseListRow[]>();
  for (const p of purchases) {
    const key = toMonthKey(p.purchase_date);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(p);
  }

  return (
    <>
      <PageHeader title="Compras" />

      <div className="p-4">
        {purchases.length === 0 ? (
          <EmptyState
            icon={<ShoppingCart className="h-8 w-8" />}
            title="Nenhuma compra registrada"
            description="Toque no + para registrar sua primeira ida ao mercado."
          />
        ) : (
          <div className="space-y-6">
            {[...groups.entries()].map(([month, rows]) => {
              const monthTotal = rows.reduce((s, r) => s + r.total, 0);
              return (
                <section key={month}>
                  <div className="mb-2 flex items-baseline justify-between">
                    <h2 className="text-sm font-semibold text-ink-muted">
                      {formatMonthLabel(month)}
                    </h2>
                    <span className="text-sm font-semibold text-ink-muted">
                      {formatBRL(monthTotal)}
                    </span>
                  </div>
                  <ul className="overflow-hidden rounded-2xl border border-line">
                    {rows.map((p) => (
                      <li key={p.id}>
                        <Link
                          href={`/compras/${p.id}`}
                          className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3.5 last:border-b-0 active:bg-surface-2"
                        >
                          <span
                            className="h-8 w-1 shrink-0 rounded-full"
                            style={{
                              background: p.market?.color ?? "#3f3f46",
                            }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate font-medium">
                              {formatLongDate(p.purchase_date)}
                            </p>
                            <p className="truncate text-xs text-ink-muted">
                              {p.market?.name ?? "Sem mercado"} ·{" "}
                              {p.itemCount}{" "}
                              {p.itemCount === 1 ? "item" : "itens"}
                              {p.status === "aberta" && (
                                <span className="text-accent"> · aberta</span>
                              )}
                            </p>
                          </div>
                          <span className="shrink-0 text-base font-bold">
                            {formatBRL(p.total)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>

      <Fab href="/compras/nova" label="Nova compra" />
    </>
  );
}
