import type { Metadata } from "next";
import Link from "next/link";
import PageHeader from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getMarkets } from "@/lib/queries";
import { todayISO } from "@/lib/format";
import { createPurchase } from "../actions";

export const metadata: Metadata = { title: "Nova compra" };

export default async function NovaCompraPage() {
  const supabase = await createClient();
  const markets = await getMarkets(supabase);

  return (
    <>
      <PageHeader title="Nova compra" backHref="/compras" />

      <form action={createPurchase} className="space-y-4 p-4">
        <div>
          <label className="label" htmlFor="market_id">
            Mercado
          </label>
          {markets.length > 0 ? (
            <select
              id="market_id"
              name="market_id"
              className="input"
              defaultValue={markets[0]?.id}
            >
              {markets.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          ) : (
            <p className="text-sm text-ink-muted">
              Nenhum mercado cadastrado.{" "}
              <Link href="/ajustes" className="text-accent">
                Cadastrar agora
              </Link>
              .
            </p>
          )}
        </div>

        <div>
          <label className="label" htmlFor="purchase_date">
            Data
          </label>
          <input
            id="purchase_date"
            name="purchase_date"
            type="date"
            defaultValue={todayISO()}
            className="input"
          />
        </div>

        <div>
          <label className="label" htmlFor="note">
            Observação (opcional)
          </label>
          <input
            id="note"
            name="note"
            className="input"
            placeholder="Ex.: compra do mês, churrasco…"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Link href="/compras" className="btn-ghost flex-1">
            Cancelar
          </Link>
          <button type="submit" className="btn flex-1">
            Criar e adicionar itens
          </button>
        </div>
      </form>
    </>
  );
}
