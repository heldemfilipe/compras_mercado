import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Star, Trash2 } from "lucide-react";
import PageHeader from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { getCategories, getTemplate } from "@/lib/queries";
import TemplateItemRow from "./template-item-row";
import TemplateAddForm from "./template-add-form";
import { deleteTemplate, renameTemplate, setDefaultTemplate } from "../actions";

export const metadata: Metadata = { title: "Editar modelo" };

export default async function ModeloDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [template, categories] = await Promise.all([
    getTemplate(supabase, id),
    getCategories(supabase),
  ]);

  if (!template) notFound();

  return (
    <>
      <PageHeader
        title={template.name}
        subtitle={`${template.items.length} ${
          template.items.length === 1 ? "item" : "itens"
        }${template.is_default ? " · padrão" : ""}`}
        backHref="/listas/modelos"
      />

      <div className="space-y-4 p-4 pb-28">
        <div className="card space-y-3">
          <form action={renameTemplate} className="flex items-end gap-2">
            <div className="flex-1">
              <label className="label" htmlFor="name">
                Nome do modelo
              </label>
              <input
                id="name"
                name="name"
                defaultValue={template.name}
                className="input"
              />
            </div>
            <input type="hidden" name="id" value={template.id} />
            <button className="btn-ghost shrink-0">Salvar</button>
          </form>

          <div className="flex gap-2">
            {!template.is_default && (
              <form action={setDefaultTemplate} className="flex-1">
                <input type="hidden" name="id" value={template.id} />
                <button className="btn-ghost w-full btn-sm">
                  <Star className="h-4 w-4" /> Tornar padrão
                </button>
              </form>
            )}
            <form
              action={deleteTemplate}
              className="flex-1"
            >
              <input type="hidden" name="id" value={template.id} />
              <button className="btn-ghost w-full btn-sm border-negative/40 text-negative">
                <Trash2 className="h-4 w-4" /> Excluir modelo
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <TemplateAddForm templateId={template.id} categories={categories} />
        </div>

        {template.items.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
            Nenhum item no modelo ainda.
          </p>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-line">
            {template.items.map((it) => (
              <TemplateItemRow
                key={it.id}
                item={it}
                templateId={template.id}
                categories={categories}
              />
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
