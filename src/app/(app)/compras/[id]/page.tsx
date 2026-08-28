import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ChevronDown } from "lucide-react";
import PageHeader from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getMarkets, getPurchase } from "@/lib/queries";
import { formatBRL, formatLongDate } from "@/lib/format";
import AddItemForm from "./add-item-form";
import ItemRow from "./item-row";
import PurchaseActions from "./purchase-actions";
import { updatePurchaseMeta } from "../actions";

export const metadata: Metadata = { title: "Compra" };

export default async function CompraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [purchase, markets, categories] = await Promise.all([
    getPurchase(supabase, id),
    getMarkets(supabase, { includeArchived: true }),
    getCategories(supabase),
  ]);

  if (!purchase) notFound();

  return (
    <>
      <PageHeader
        title={formatBRL(purchase.total)}
        subtitle={`${formatLongDate(purchase.purchase_date)}${
          purchase.market ? ` · ${purchase.market.name}` : ""
        }`}
        backHref="/compras"
        action={<PurchaseActions id={purchase.id} status={purchase.status} />}
      />

      <div className="p-4 pb-48">
        <details className="card mb-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink-muted">
            Data, mercado e observação
            <ChevronDown className="h-4 w-4" />
          </summary>
          <form action={updatePurchaseMeta} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={purchase.id} />
            <div>
              <label className="label" htmlFor="purchase_date">
                Data
              </label>
              <input
                id="purchase_date"
                type="date"
                name="purchase_date"
                defaultValue={purchase.purchase_date.slice(0, 10)}
                className="input"
              />
            </div>
            <div>
              <label className="label" htmlFor="market_id">
                Mercado
              </label>
              <select
                id="market_id"
                name="market_id"
                defaultValue={purchase.market?.id ?? ""}
                className="input"
              >
                <option value="">Sem mercado</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="note">
                Observação
              </label>
              <input
                id="note"
                name="note"
                defaultValue={purchase.note ?? ""}
                className="input"
              />
            </div>
            <button className="btn btn-sm w-full">Salvar</button>
          </form>
        </details>

        <div className="mb-2 flex items-center justify-between px-1">
          <span className="text-sm text-ink-muted">
            {purchase.items.length}{" "}
            {purchase.items.length === 1 ? "item" : "itens"}
          </span>
          <span
            className={`chip ${
              purchase.status === "aberta"
                ? "border-accent/40 text-accent"
                : "border-positive/40 text-positive"
            }`}
          >
            {purchase.status === "aberta" ? "Aberta" : "Concluída"}
          </span>
        </div>

        {purchase.items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
            Nenhum item. Use o formulário abaixo para incluir.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line">
            {purchase.items.map((it) => (
              <ItemRow
                key={it.id}
                item={it}
                purchaseId={purchase.id}
                categories={categories}
                editable
              />
            ))}
          </ul>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-md">
          <AddItemForm purchaseId={purchase.id} categories={categories} />
        </div>
      </div>
    </>
  );
}
