"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { parseImportText } from "@/lib/import-parse";
import { guessCategoryName } from "@/lib/categorize";
import { formatBRL, todayISO } from "@/lib/format";
import { importPurchase } from "../actions";

type Market = { id: string; name: string };

const EXEMPLO = `2x R$ 3,99
refri
1x R$ 12,35
suco uva
3x R$ 8,00
panos de prato`;

export default function ImportForm({ markets }: { markets: Market[] }) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState(false);

  const items = useMemo(() => parseImportText(text), [text]);
  const total = items.reduce((s, it) => s + it.qty * it.price, 0);

  return (
    <div className="space-y-4 p-4">
      <p className="text-sm text-ink-muted">
        Cole a lista (ex.: os itens do app SOMA, um por linha ou no formato{" "}
        <code className="text-ink">2x R$ 3,99</code> + nome na linha de baixo).
        Cada item entra já categorizado automaticamente.
      </p>

      <form
        action={async (fd) => {
          setPending(true);
          try {
            await importPurchase(fd);
          } finally {
            setPending(false);
          }
        }}
        className="space-y-4"
      >
        <div className="flex gap-2">
          <div className="flex-1">
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
          <div className="flex-1">
            <label className="label" htmlFor="market_id">
              Mercado
            </label>
            <select
              id="market_id"
              name="market_id"
              className="input"
              defaultValue={markets[0]?.id ?? ""}
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

        <div>
          <label className="label" htmlFor="text">
            Itens colados
          </label>
          <textarea
            id="text"
            name="text"
            rows={10}
            className="input font-mono text-[13px] leading-relaxed"
            placeholder={EXEMPLO}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          {text.trim() === "" && (
            <button
              type="button"
              onClick={() => setText(EXEMPLO)}
              className="mt-1 text-xs text-accent"
            >
              usar exemplo
            </button>
          )}
        </div>

        {items.length > 0 && (
          <div className="overflow-hidden rounded-2xl border border-line">
            <div className="flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2 text-sm">
              <span className="font-medium">
                {items.length} {items.length === 1 ? "item" : "itens"}
              </span>
              <span className="font-bold">{formatBRL(total)}</span>
            </div>
            <ul className="max-h-72 overflow-y-auto">
              {items.map((it, idx) => {
                const guess = guessCategoryName(it.name);
                return (
                  <li
                    key={idx}
                    className="flex items-center gap-2 border-b border-line px-4 py-2 text-sm last:border-b-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate">
                        {it.qty}× {formatBRL(it.price)} — {it.name}
                      </p>
                      {guess && (
                        <span className="flex items-center gap-1 text-xs text-ink-faint">
                          <Sparkles className="h-3 w-3" />
                          {guess}
                        </span>
                      )}
                    </div>
                    <span className="shrink-0 font-medium">
                      {formatBRL(it.qty * it.price)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        <div className="flex gap-2">
          <Link href="/compras" className="btn-ghost flex-1">
            Cancelar
          </Link>
          <button
            type="submit"
            className="btn flex-1"
            disabled={pending || items.length === 0}
          >
            {pending ? "Importando…" : `Importar ${items.length || ""} itens`}
          </button>
        </div>
      </form>
    </div>
  );
}
