"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { formatBRL, formatQty } from "@/lib/format";
import { deleteListItem, toggleListItem, updateListItem } from "../actions";

type Cat = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  quantity: number;
  is_weight: boolean;
  unit_price: number | null;
  checked: boolean;
  note: string | null;
  category: { id: string; name: string; color: string | null } | null;
};

export default function ListItemRow({
  item,
  listId,
  categories,
  locked,
}: {
  item: Item;
  listId: string;
  categories: Cat[];
  locked: boolean;
}) {
  const [editing, setEditing] = useState(false);

  const lineTotal = (item.unit_price ?? 0) * item.quantity;

  if (editing) {
    return (
      <li className="border-b border-line bg-surface-2 p-3 last:border-b-0">
        <form
          action={async (fd) => {
            await updateListItem(fd);
            setEditing(false);
          }}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="list_id" value={listId} />
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
              defaultValue={
                item.unit_price == null
                  ? ""
                  : String(item.unit_price).replace(".", ",")
              }
              placeholder="R$"
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
          <input
            name="note"
            defaultValue={item.note ?? ""}
            placeholder="Observação (marca, tamanho…)"
            className="input"
          />
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
          action={deleteListItem}
          className="mt-2 border-t border-line pt-2 text-center"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="list_id" value={listId} />
          <button className="text-sm text-negative">
            <Trash2 className="mr-1 inline h-3.5 w-3.5" />
            Remover da lista
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 border-b border-line bg-surface px-3 py-2.5 last:border-b-0">
      <form action={toggleListItem} className="flex">
        <input type="hidden" name="id" value={item.id} />
        <input type="hidden" name="list_id" value={listId} />
        <input type="hidden" name="checked" value={String(item.checked)} />
        <button
          type="submit"
          aria-label={item.checked ? "Desmarcar" : "Marcar"}
          className={`flex h-6 w-6 items-center justify-center rounded-md border transition ${
            item.checked
              ? "border-accent bg-accent text-accent-ink"
              : "border-line"
          }`}
        >
          {item.checked && (
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor">
              <path d="M7.6 13.3 4.3 10l-1.1 1.1 4.4 4.4 9-9L15.5 5z" />
            </svg>
          )}
        </button>
      </form>

      <div className="min-w-0 flex-1">
        <p
          className={`truncate text-[15px] ${
            item.checked ? "text-ink-faint line-through" : "font-medium"
          }`}
        >
          {item.name}
        </p>
        <p className="truncate text-xs text-ink-muted">
          {item.is_weight ? `${formatQty(item.quantity)} kg` : `${formatQty(item.quantity)}×`}
          {item.unit_price != null && ` · ${formatBRL(item.unit_price)}`}
          {item.note && ` · ${item.note}`}
        </p>
      </div>

      {item.unit_price != null && (
        <span className="shrink-0 text-sm font-semibold">
          {formatBRL(lineTotal)}
        </span>
      )}

      {!locked && (
        <button
          onClick={() => setEditing(true)}
          className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:text-ink"
          aria-label="Editar item"
        >
          <Pencil className="h-4 w-4" />
        </button>
      )}
    </li>
  );
}
