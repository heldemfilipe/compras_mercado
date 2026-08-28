import type { Metadata } from "next";
import Link from "next/link";
import { ListChecks, LayoutTemplate, ArrowRight } from "lucide-react";
import PageHeader from "@/components/page-header";
import EmptyState from "@/components/empty-state";
import { createClient } from "@/lib/supabase/server";
import { getMarkets, getShoppingLists, getTemplates } from "@/lib/queries";
import { formatBRL, formatMonthLabel, toMonthKey } from "@/lib/format";
import NewListForm from "./new-list-form";

export const metadata: Metadata = { title: "Listas" };

export default async function ListasPage() {
  const supabase = await createClient();
  const [lists, templates, markets] = await Promise.all([
    getShoppingLists(supabase),
    getTemplates(supabase),
    getMarkets(supabase),
  ]);

  const active = lists.filter((l) => l.status === "ativa");
  const done = lists.filter((l) => l.status !== "ativa");

  return (
    <>
      <PageHeader
        title="Listas"
        action={
          <Link
            href="/listas/modelos"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm text-ink-muted hover:text-ink"
          >
            <LayoutTemplate className="h-4 w-4" />
            Modelos
          </Link>
        }
      />

      <div className="space-y-6 p-4">
        <NewListForm templates={templates} markets={markets} />

        <section>
          <h2 className="mb-2 text-sm font-semibold text-ink-muted">
            Listas ativas
          </h2>
          {active.length === 0 ? (
            <EmptyState
              icon={<ListChecks className="h-8 w-8" />}
              title="Nenhuma lista ativa"
              description="Gere uma lista a partir de um modelo acima para começar."
            />
          ) : (
            <ul className="space-y-2">
              {active.map((l) => (
                <li key={l.id}>
                  <Link
                    href={`/listas/${l.id}`}
                    className="card flex items-center gap-3 active:bg-surface-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium">{l.title}</p>
                      <p className="truncate text-xs text-ink-muted">
                        {formatMonthLabel(toMonthKey(l.reference_month))}
                        {l.market ? ` · ${l.market.name}` : ""}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-2">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{
                            width: `${
                              l.total ? (l.checked / l.total) * 100 : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-semibold">
                        {l.checked}/{l.total}
                      </p>
                      {l.estimated > 0 && (
                        <p className="text-xs text-ink-muted">
                          ~{formatBRL(l.estimated)}
                        </p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {done.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-ink-muted">
              Concluídas
            </h2>
            <ul className="space-y-2">
              {done.map((l) => (
                <li key={l.id}>
                  <Link
                    href={
                      l.purchase_id
                        ? `/compras/${l.purchase_id}`
                        : `/listas/${l.id}`
                    }
                    className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm text-ink-muted active:bg-surface-2"
                  >
                    <span className="flex-1 truncate">{l.title}</span>
                    <span>
                      {formatMonthLabel(toMonthKey(l.reference_month))}
                    </span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
