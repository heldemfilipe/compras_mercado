import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronDown, ExternalLink } from "lucide-react";
import PageHeader from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getMarkets, getShoppingList } from "@/lib/queries";
import { formatBRL, formatMonthLabel, toMonthKey } from "@/lib/format";
import ListItemsView from "./list-items-view";
import ListBottomBar from "./list-bottom-bar";
import ListActions from "./list-actions";
import { updateListMeta } from "../actions";

export const metadata: Metadata = { title: "Lista" };

export default async function ListaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [list, categories, markets] = await Promise.all([
    getShoppingList(supabase, id),
    getCategories(supabase),
    getMarkets(supabase, { includeArchived: true }),
  ]);

  if (!list) notFound();

  const locked = list.status !== "ativa";
  const checkedCount = list.items.filter((i) => i.checked).length;
  const estimated = list.items.reduce(
    (s, i) => s + (i.unit_price ?? 0) * i.quantity,
    0,
  );

  return (
    <>
      <PageHeader
        title={list.title}
        subtitle={`${formatMonthLabel(toMonthKey(list.reference_month))} · ${
          checkedCount
        }/${list.items.length} itens`}
        backHref="/listas"
        action={<ListActions id={list.id} status={list.status} />}
      />

      <div className="p-4 pb-44">
        {locked && list.purchase_id && (
          <Link
            href={`/compras/${list.purchase_id}`}
            className="mb-4 flex items-center justify-between rounded-xl border border-positive/40 bg-positive/10 px-4 py-3 text-sm text-positive"
          >
            Compra registrada — ver detalhes
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}

        <details className="card mb-4">
          <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-medium text-ink-muted">
            Editar lista
            <ChevronDown className="h-4 w-4" />
          </summary>
          <form action={updateListMeta} className="mt-3 space-y-3">
            <input type="hidden" name="id" value={list.id} />
            <div>
              <label className="label" htmlFor="title">
                Título
              </label>
              <input
                id="title"
                name="title"
                defaultValue={list.title}
                className="input"
              />
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="label" htmlFor="reference_month">
                  Mês
                </label>
                <input
                  id="reference_month"
                  name="reference_month"
                  type="month"
                  defaultValue={toMonthKey(list.reference_month)}
                  className="input"
                />
              </div>
              <div className="flex-1">
                <label className="label" htmlFor="market_id">
                  Mercado
                </label>
                <select
                  id="market_id"
                  name="market_id"
                  defaultValue={list.market_id ?? ""}
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
            </div>
            <button className="btn btn-sm w-full">Salvar</button>
          </form>
        </details>

        {!locked && (
          <div className="mb-3 flex items-center justify-between rounded-xl bg-surface-2 px-4 py-2.5 text-sm">
            <span className="text-ink-muted">
              Total {checkedCount < list.items.length ? "(parcial)" : ""}
            </span>
            <span className="font-semibold">{formatBRL(estimated)}</span>
          </div>
        )}

        <ListItemsView
          items={list.items}
          listId={list.id}
          categories={categories}
          locked={locked}
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50">
        <div className="mx-auto w-full max-w-md">
          <ListBottomBar
            listId={list.id}
            categories={categories}
            itemCount={list.items.length}
            checkedCount={checkedCount}
            locked={locked}
          />
        </div>
      </div>
    </>
  );
}
