"use client";

import { useRef, useState } from "react";
import { Minus, Plus, ShoppingCart, Sparkles } from "lucide-react";
import { guessCategoryName } from "@/lib/categorize";
import { addListItem, convertListToPurchase } from "../actions";

type Cat = { id: string; name: string };

export default function ListBottomBar({
  listId,
  categories,
  itemCount,
  checkedCount,
  locked,
}: {
  listId: string;
  categories: Cat[];
  itemCount: number;
  checkedCount: number;
  locked: boolean;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [qty, setQty] = useState(1);
  const [name, setName] = useState("");
  const [catId, setCatId] = useState("");

  const guess = catId === "" ? guessCategoryName(name) : null;

  return (
    <div className="border-t border-line bg-surface p-3">
      {!locked && (
        <form
          ref={ref}
          action={async (fd) => {
            await addListItem(fd);
            setName("");
            setQty(1);
            setCatId("");
            ref.current
              ?.querySelector<HTMLInputElement>('[name="name"]')
              ?.focus();
          }}
          className="space-y-2"
        >
          <input type="hidden" name="list_id" value={listId} />

          <div className="flex gap-2">
            <input
              name="name"
              required
              autoComplete="off"
              placeholder="Adicionar item à lista…"
              className="input flex-1"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <button
              type="submit"
              className="btn shrink-0 !px-3"
              aria-label="Adicionar"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="btn-ghost h-9 w-9 !px-0"
                aria-label="Diminuir"
              >
                <Minus className="h-4 w-4" />
              </button>
              <input
                name="quantity"
                readOnly
                value={qty}
                aria-label="Quantidade"
                className="w-8 bg-transparent text-center text-[15px] font-semibold"
              />
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="btn-ghost h-9 w-9 !px-0"
                aria-label="Aumentar"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>

            {categories.length > 0 && (
              <select
                name="category_id"
                aria-label="Categoria"
                className="input flex-1"
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
              >
                <option value="">Categoria: automática</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {guess && (
            <p className="flex items-center gap-1 px-1 text-xs text-ink-faint">
              <Sparkles className="h-3 w-3" />
              <span className="text-ink-muted">{guess}</span>
            </p>
          )}
        </form>
      )}

      {!locked && (
        <form
          action={async (fd) => {
            const msg =
              checkedCount > 0
                ? `Registrar compra com os ${checkedCount} itens marcados?`
                : `Nenhum item marcado. Registrar compra com todos os ${itemCount} itens?`;
            if (!confirm(msg)) return;
            setBusy(true);
            try {
              await convertListToPurchase(fd);
            } finally {
              setBusy(false);
            }
          }}
          className="mt-2"
        >
          <input type="hidden" name="id" value={listId} />
          <button className="btn w-full" disabled={busy || itemCount === 0}>
            <ShoppingCart className="h-4 w-4" />
            Registrar compra
          </button>
        </form>
      )}
    </div>
  );
}
