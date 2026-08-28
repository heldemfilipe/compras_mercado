import type { Metadata } from "next";
import Link from "next/link";
import { LayoutTemplate, Star, ChevronRight } from "lucide-react";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getTemplates } from "@/lib/queries";
import { createTemplate, setDefaultTemplate } from "./actions";

export const metadata: Metadata = { title: "Modelos de lista" };

export default async function ModelosPage() {
  const supabase = await createClient();
  const templates = await getTemplates(supabase);

  return (
    <>
      <PageHeader title="Modelos de lista" backHref="/listas" />

      <div className="space-y-6 p-4">
        <form action={createTemplate} className="card space-y-3">
          <div>
            <label className="label" htmlFor="name">
              Novo modelo
            </label>
            <input
              id="name"
              name="name"
              required
              className="input"
              placeholder="Ex.: Compra do mês, Feira, Farmácia…"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="is_default"
              className="h-4 w-4 accent-[#3b82f6]"
            />
            Definir como modelo padrão
          </label>
          <button className="btn w-full">Criar e adicionar itens</button>
        </form>

        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-muted">
            Seus modelos
          </h2>
          {templates.length === 0 ? (
            <EmptyState
              icon={<LayoutTemplate className="h-8 w-8" />}
              title="Nenhum modelo ainda"
              description="Crie um modelo com os itens que você sempre compra. Depois é só gerar a lista do mês em 1 toque."
            />
          ) : (
            <ul className="space-y-2">
              {templates.map((t) => (
                <li
                  key={t.id}
                  className="card flex items-center gap-3"
                >
                  <form action={setDefaultTemplate} className="flex">
                    <input type="hidden" name="id" value={t.id} />
                    <button
                      aria-label="Definir como padrão"
                      className={
                        t.is_default ? "text-accent" : "text-ink-faint"
                      }
                    >
                      <Star
                        className="h-5 w-5"
                        fill={t.is_default ? "currentColor" : "none"}
                      />
                    </button>
                  </form>
                  <Link
                    href={`/listas/modelos/${t.id}`}
                    className="flex flex-1 items-center justify-between"
                  >
                    <span>
                      <span className="font-medium">{t.name}</span>
                      <span className="block text-xs text-ink-muted">
                        {t.itemCount}{" "}
                        {t.itemCount === 1 ? "item" : "itens"}
                        {t.is_default ? " · padrão" : ""}
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 text-ink-faint" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
