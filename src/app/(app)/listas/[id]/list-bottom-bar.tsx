"use client";

import { useRef, useState } from "react";
import { Plus, ShoppingCart } from "lucide-react";
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

  return (
    <div className="border-t border-line bg-surface p-3">
      {!locked && (
        <form
          ref={ref}
          action={async (fd) => {
            await addListItem(fd);
            ref.current?.reset();
            ref.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus();
          }}
          className="flex gap-2"
        >
          <input type="hidden" name="list_id" value={listId} />
          <input
            name="name"
            required
            autoComplete="off"
            placeholder="Adicionar item à lista…"
            className="input flex-1"
          />
          {categories.length > 0 && (
            <select
              name="category_id"
              defaultValue=""
              aria-label="Categoria"
              className="input w-28"
            >
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
          <button type="submit" className="btn shrink-0 !px-3" aria-label="Adicionar">
            <Plus className="h-4 w-4" />
          </button>
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
          <button
            className="btn w-full"
            disabled={busy || itemCount === 0}
          >
            <ShoppingCart className="h-4 w-4" />
            Registrar compra
          </button>
        </form>
      )}
    </div>
  );
}
