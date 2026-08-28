import type { Metadata } from "next";
import { BarChart3 } from "lucide-react";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getFlatItems, getMonthlyTotals } from "@/lib/queries";
import GraficosClient from "./graficos-client";

export const metadata: Metadata = { title: "Gráficos" };

export default async function GraficosPage() {
  const supabase = await createClient();
  const [items, monthly] = await Promise.all([
    getFlatItems(supabase, 24),
    getMonthlyTotals(supabase, 24),
  ]);

  return (
    <>
      <PageHeader title="Gráficos" />

      <div className="space-y-6 p-4">
        {monthly.length === 0 ? (
          <EmptyState
            icon={<BarChart3 className="h-8 w-8" />}
            title="Ainda não há dados"
            description="Registre algumas compras com itens para ver a evolução dos gastos aqui."
          />
        ) : (
          <GraficosClient items={items} monthly={monthly} />
        )}
      </div>
    </>
  );
}
