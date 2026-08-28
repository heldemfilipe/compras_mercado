"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { formatBRL, formatQty } from "@/lib/format";
import { deleteItem, updateItem } from "../actions";

type Cat = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  quantity: number;
  unit_price: number;
  total: number;
  is_weight: boolean;
  category: { id: string; name: string; color: string | null } | null;
};

export default function ItemRow({
  item,
  purchaseId,
  categories,
  editable,
}: {
  item: Item;
  purchaseId: string;
  categories: Cat[];
  editable: boolean;
}) {
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <li className="border-b border-line bg-surface-2 p-3 last:border-b-0">
        <form
          action={async (fd) => {
            await updateItem(fd);
            setEditing(false);
          }}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="purchase_id" value={purchaseId} />
          <div className="flex gap-2">
            <input
              name="name"
              defaultValue={item.name}
              required
              className="input flex-1"
            />
            <input
              name="unit_price"
              inputMode="decimal"
              defaultValue={String(item.unit_price).replace(".", ",")}
              className="input w-24 text-right"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              name="quantity"
              inputMode="decimal"
              defaultValue={formatQty(item.quantity)}
              aria-label="Quantidade"
              className="input w-20 text-center"
            />
            {categories.length > 0 && (
              <select
                name="category_id"
                defaultValue={item.category?.id ?? ""}
                className="input flex-1"
              >
                <option value="">Automático (pela descrição)</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
          <label className="flex items-center gap-2 text-sm text-ink-muted">
            <input
              type="checkbox"
              name="is_weight"
              defaultChecked={item.is_weight}
              className="h-4 w-4 accent-[#3b82f6]"
            />
            Por peso
          </label>
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="btn-ghost btn-sm flex-1"
            >
              <X className="h-3.5 w-3.5" /> Cancelar
            </button>
            <button type="submit" className="btn btn-sm flex-1">
              Salvar
            </button>
          </div>
        </form>

        <form
          action={deleteItem}
          className="mt-2 border-t border-line pt-2 text-center"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="purchase_id" value={purchaseId} />
          <button className="text-sm text-negative">
            <Trash2 className="mr-1 inline h-3.5 w-3.5" />
            Excluir item
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="text-sm text-ink-muted">
          {item.is_weight
            ? `${formatQty(item.quantity)} kg × ${formatBRL(item.unit_price)}`
            : `${formatQty(item.quantity)}× ${formatBRL(item.unit_price)}`}
        </p>
        <p className="truncate font-medium">{item.name}</p>
        {item.category && (
          <span className="mt-0.5 inline-flex items-center gap-1 text-xs text-ink-faint">
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: item.category.color ?? "#52525b" }}
            />
            {item.category.name}
          </span>
        )}
      </div>
      <span className="shrink-0 font-bold">{formatBRL(item.total)}</span>
      {editable && (
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-lg p-2 text-ink-faint hover:text-ink"
          aria-label="Editar item"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
