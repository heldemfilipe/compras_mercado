import type { Metadata } from "next";
import { Archive, ArchiveRestore, Plus, Store, Tag, Trash2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getMarkets, getProfileName } from "@/lib/queries";
import {
  addCategory,
  addMarket,
  deleteCategory,
  deleteMarket,
  renameMarket,
  toggleMarketArchived,
  updateDisplayName,
} from "./actions";

export const metadata: Metadata = { title: "Ajustes" };

export default async function AjustesPage() {
  const supabase = await createClient();
  const [markets, categories, name, { data: userData }] = await Promise.all([
    getMarkets(supabase, { includeArchived: true }),
    getCategories(supabase),
    getProfileName(supabase),
    supabase.auth.getUser(),
  ]);

  return (
    <>
      <PageHeader title="Ajustes" />
      <div className="space-y-6 p-4">
        {/* Mercados */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <Store className="h-4 w-4" /> Mercados
          </h2>

          <form action={addMarket} className="card mb-3 flex items-end gap-2">
            <div className="flex-1">
              <label className="label" htmlFor="market-name">
                Novo mercado
              </label>
              <input
                id="market-name"
                name="name"
                required
                className="input"
                placeholder="Ex.: Assaí, Carrefour, Feira…"
              />
            </div>
            <input
              type="color"
              name="color"
              defaultValue="#3b82f6"
              aria-label="Cor"
              className="h-11 w-11 shrink-0 rounded-xl border border-line bg-surface-2"
            />
            <button className="btn shrink-0" type="submit">
              <Plus className="h-4 w-4" />
            </button>
          </form>

          <ul className="space-y-2">
            {markets.map((m) => (
              <li key={m.id} className="card flex items-center gap-3 py-3">
                <span
                  className="h-3 w-3 shrink-0 rounded-full"
                  style={{ background: m.color ?? "#52525b" }}
                />
                <form
                  action={renameMarket}
                  className="flex flex-1 items-center gap-2"
                >
                  <input type="hidden" name="id" value={m.id} />
                  <input
                    name="name"
                    defaultValue={m.name}
                    className={`w-full bg-transparent text-[15px] outline-none ${
                      m.archived ? "text-ink-faint line-through" : ""
                    }`}
                  />
                </form>
                <form action={toggleMarketArchived}>
                  <input type="hidden" name="id" value={m.id} />
                  <input
                    type="hidden"
                    name="archived"
                    value={String(m.archived)}
                  />
                  <button
                    className="rounded-lg p-2 text-ink-muted hover:text-ink"
                    title={m.archived ? "Reativar" : "Arquivar"}
                  >
                    {m.archived ? (
                      <ArchiveRestore className="h-4 w-4" />
                    ) : (
                      <Archive className="h-4 w-4" />
                    )}
                  </button>
                </form>
                <form action={deleteMarket}>
                  <input type="hidden" name="id" value={m.id} />
                  <button
                    className="rounded-lg p-2 text-ink-muted hover:text-negative"
                    title="Excluir"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </form>
              </li>
            ))}
            {markets.length === 0 && (
              <li className="text-sm text-ink-muted">
                Nenhum mercado ainda. Adicione o primeiro acima.
              </li>
            )}
          </ul>
          <p className="mt-2 text-xs text-ink-faint">
            Renomeou? Toque fora do campo ou pressione Enter para salvar.
          </p>
        </section>

        {/* Categorias */}
        <section>
          <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-ink-muted">
            <Tag className="h-4 w-4" /> Categorias
          </h2>

          <form action={addCategory} className="card mb-3 flex items-end gap-2">
            <div className="flex-1">
              <label className="label" htmlFor="cat-name">
                Nova categoria
              </label>
              <input
                id="cat-name"
                name="name"
                required
                className="input"
                placeholder="Ex.: Limpeza, Hortifruti…"
              />
            </div>
            <input
              type="color"
              name="color"
              defaultValue="#22c55e"
              aria-label="Cor"
              className="h-11 w-11 shrink-0 rounded-xl border border-line bg-surface-2"
            />
            <button className="btn shrink-0" type="submit">
              <Plus className="h-4 w-4" />
            </button>
          </form>

          <ul className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <li key={c.id}>
                <form action={deleteCategory}>
                  <input type="hidden" name="id" value={c.id} />
                  <button className="chip hover:border-negative hover:text-negative">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ background: c.color ?? "#52525b" }}
                    />
                    {c.name}
                    <Trash2 className="h-3 w-3" />
                  </button>
                </form>
              </li>
            ))}
            {categories.length === 0 && (
              <li className="text-sm text-ink-muted">
                Nenhuma categoria. Opcionais, mas ajudam nos gráficos.
              </li>
            )}
          </ul>
        </section>

        {/* Conta */}
        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-muted">Conta</h2>
          <div className="card space-y-4">
            <div>
              <p className="text-sm text-ink-muted">
                {userData.user?.email}
              </p>
            </div>
            <form action={updateDisplayName} className="flex items-end gap-2">
              <div className="flex-1">
                <label className="label" htmlFor="display_name">
                  Seu nome
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  defaultValue={name ?? ""}
                  className="input"
                  placeholder="Como aparecer no app"
                />
              </div>
              <button className="btn-ghost shrink-0" type="submit">
                Salvar
              </button>
            </form>
            <form action="/auth/signout" method="post">
              <button className="btn-ghost w-full border-negative/40 text-negative">
                Sair
              </button>
            </form>
          </div>
        </section>
      </div>
    </>
  );
}
