"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, FilePlus2 } from "lucide-react";
import { createBlankList, generateListFromTemplate } from "./actions";

type TemplateRow = { id: string; name: string; is_default: boolean };
type Market = { id: string; name: string };

export default function NewListForm({
  templates,
  markets,
}: {
  templates: TemplateRow[];
  markets: Market[];
}) {
  const [mode, setMode] = useState<"template" | "blank">(
    templates.length > 0 ? "template" : "blank",
  );

  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, "0")}`;
  const defaultTemplate =
    templates.find((t) => t.is_default)?.id ?? templates[0]?.id;

  return (
    <div className="card">
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          onClick={() => setMode("template")}
          disabled={templates.length === 0}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition disabled:opacity-40 ${
            mode === "template"
              ? "border-accent bg-accent/10 text-accent"
              : "border-line text-ink-muted"
          }`}
        >
          <Sparkles className="h-4 w-4" /> De um modelo
        </button>
        <button
          type="button"
          onClick={() => setMode("blank")}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium transition ${
            mode === "blank"
              ? "border-accent bg-accent/10 text-accent"
              : "border-line text-ink-muted"
          }`}
        >
          <FilePlus2 className="h-4 w-4" /> Em branco
        </button>
      </div>

      {mode === "template" && templates.length === 0 && (
        <p className="text-sm text-ink-muted">
          Você ainda não tem modelos.{" "}
          <Link href="/listas/modelos" className="text-accent">
            Criar um modelo
          </Link>
          .
        </p>
      )}

      {mode === "template" ? (
        <form
          action={generateListFromTemplate}
          className="space-y-3"
          key="tpl"
        >
          <div>
            <label className="label" htmlFor="template_id">
              Modelo
            </label>
            <select
              id="template_id"
              name="template_id"
              defaultValue={defaultTemplate}
              className="input"
              required
            >
              {templates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                  {t.is_default ? " (padrão)" : ""}
                </option>
              ))}
            </select>
          </div>
          <MonthAndMarket
            currentMonth={currentMonth}
            markets={markets}
          />
          <button className="btn w-full" disabled={templates.length === 0}>
            Gerar lista do mês
          </button>
        </form>
      ) : (
        <form action={createBlankList} className="space-y-3" key="blank">
          <div>
            <label className="label" htmlFor="title">
              Título
            </label>
            <input
              id="title"
              name="title"
              className="input"
              placeholder="Ex.: Compra do mês"
            />
          </div>
          <MonthAndMarket currentMonth={currentMonth} markets={markets} />
          <button className="btn w-full">Criar lista</button>
        </form>
      )}
    </div>
  );
}

function MonthAndMarket({
  currentMonth,
  markets,
}: {
  currentMonth: string;
  markets: Market[];
}) {
  return (
    <div className="flex gap-2">
      <div className="flex-1">
        <label className="label" htmlFor="month">
          Mês
        </label>
        <input
          id="month"
          name="month"
          type="month"
          defaultValue={currentMonth}
          className="input"
        />
      </div>
      <div className="flex-1">
        <label className="label" htmlFor="market_id">
          Mercado
        </label>
        <select id="market_id" name="market_id" className="input" defaultValue="">
          <option value="">Depois</option>
          {markets.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
