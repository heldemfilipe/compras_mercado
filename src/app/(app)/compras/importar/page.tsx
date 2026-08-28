import type { Metadata } from "next";
import PageHeader from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getMarkets } from "@/lib/queries";
import ImportForm from "./import-form";

export const metadata: Metadata = { title: "Importar compra" };

export default async function ImportarPage() {
  const supabase = await createClient();
  const markets = await getMarkets(supabase);

  return (
    <>
      <PageHeader title="Importar compra" backHref="/compras" />
      <ImportForm markets={markets} />
    </>
  );
}
