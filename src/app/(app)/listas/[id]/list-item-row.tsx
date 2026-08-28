"use client";

import { useRef, useState } from "react";
import { Check, Minus, Plus, Scale, Trash2, X } from "lucide-react";
import { formatBRL, formatQty } from "@/lib/format";
import {
  deleteListItem,
  setListItemField,
  toggleListItem,
  updateListItem,
} from "../actions";

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
  const [weight, setWeight] = useState(item.is_weight);
  const [editQty, setEditQty] = useState(item.quantity || 1);

  // estado inline (linha compacta)
  const priceForm = useRef<HTMLFormElement>(null);
  const qtyForm = useRef<HTMLFormElement>(null);
  const [price, setPrice] = useState(
    item.unit_price == null ? "" : String(item.unit_price).replace(".", ","),
  );
  const [qty, setQty] = useState(item.quantity || 1);
  const [kg, setKg] = useState(formatQty(item.quantity));

  const numFromStr = (s: string) => {
    const n = Number(s.replace(/\./g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  const lineTotal = numFromStr(price) * (item.is_weight ? numFromStr(kg) : qty);

  async function saveQty(next: number) {
    setQty(next);
    const fd = new FormData();
    fd.set("id", item.id);
    fd.set("list_id", listId);
    fd.set("quantity", String(next));
    await setListItemField(fd);
  }

  /* ------------------------------- EDIÇÃO ------------------------------- */
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
          <input type="hidden" name="is_weight" value={weight ? "on" : ""} />

          <input
            name="name"
            defaultValue={item.name}
            required
            autoFocus
            className="input"
            placeholder="Produto"
          />

          <div className="flex items-center gap-2">
            {weight ? (
              <input
                name="quantity"
                inputMode="decimal"
                defaultValue={formatQty(item.quantity)}
                placeholder="kg"
                aria-label="Peso (kg)"
                className="input w-20 text-center"
              />
            ) : (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setEditQty((q) => Math.max(1, q - 1))}
                  className="btn-ghost h-10 w-10 !px-0"
                  aria-label="Diminuir"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <input
                  name="quantity"
                  readOnly
                  value={editQty}
                  aria-label="Quantidade"
                  className="w-9 bg-transparent text-center text-[15px] font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setEditQty((q) => q + 1)}
                  className="btn-ghost h-10 w-10 !px-0"
                  aria-label="Aumentar"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                R$
              </span>
              <input
                name="unit_price"
                inputMode="decimal"
                defaultValue={price}
                placeholder="0,00"
                aria-label="Valor unitário"
                className="input w-full pl-9 text-right"
              />
            </div>

            <button
              type="button"
              onClick={() => setWeight((w) => !w)}
              aria-pressed={weight}
              aria-label="Por peso"
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${
                weight
                  ? "border-accent bg-accent/10 text-accent"
                  : "border-line text-ink-muted"
              }`}
            >
              <Scale className="h-4 w-4" />
            </button>
          </div>

          {categories.length > 0 && (
            <select
              name="category_id"
              defaultValue={item.category?.id ?? ""}
              className="input"
            >
              <option value="">Categoria: automática</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          <input
            name="note"
            defaultValue={item.note ?? ""}
            placeholder="Observação (marca, tamanho…)"
            className="input"
          />

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

  /* --------------------------- LINHA COMPACTA --------------------------- */
  const stop = (e: React.MouseEvent) => e.stopPropagation();

  return (
    <li
      className={`border-b px-3 py-2.5 transition-colors last:border-b-0 ${
        item.checked
          ? "border-positive/20 bg-positive/15"
          : "border-line bg-surface"
      }`}
    >
      <div className="flex items-center gap-2">
        <form action={toggleListItem} className="flex" onClick={stop}>
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="list_id" value={listId} />
          <input type="hidden" name="checked" value={String(item.checked)} />
          <button
            type="submit"
            aria-label={item.checked ? "Desmarcar" : "Marcar como comprado"}
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border transition ${
              item.checked
                ? "border-positive bg-positive text-white"
                : "border-line"
            }`}
          >
            {item.checked && <Check className="h-4 w-4" strokeWidth={3} />}
          </button>
        </form>

        <button
          type="button"
          onClick={() => !locked && setEditing(true)}
          className="min-w-0 flex-1 text-left"
        >
          <p
            className={`truncate text-[15px] ${
              item.checked ? "text-ink-muted line-through" : "font-medium"
            }`}
          >
            {item.name}
          </p>
        </button>

        {!locked ? (
          <form
            ref={priceForm}
            action={setListItemField}
            onClick={stop}
            className="flex items-center rounded-lg border border-line bg-surface-2 pl-2"
          >
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="list_id" value={listId} />
            <span className="text-xs text-ink-faint">R$</span>
            <input
              name="unit_price"
              inputMode="decimal"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              onBlur={() => priceForm.current?.requestSubmit()}
              placeholder="0,00"
              aria-label={`Preço de ${item.name}`}
              className="w-16 bg-transparent px-1 py-1.5 text-right text-[15px] outline-none"
            />
          </form>
        ) : (
          item.unit_price != null && (
            <span className="text-sm text-ink-muted">
              {formatBRL(item.unit_price)}
            </span>
          )
        )}
      </div>

      {/* segunda linha: quantidade + categoria + total */}
      <div className="mt-1 flex items-center gap-2 pl-9 text-xs text-ink-faint">
        {!locked ? (
          item.is_weight ? (
            <form
              ref={qtyForm}
              action={setListItemField}
              onClick={stop}
              className="flex items-center gap-1"
            >
              <input type="hidden" name="id" value={item.id} />
              <input type="hidden" name="list_id" value={listId} />
              <input
                name="quantity"
                inputMode="decimal"
                value={kg}
                onChange={(e) => setKg(e.target.value)}
                onBlur={() => qtyForm.current?.requestSubmit()}
                aria-label="Peso em kg"
                className="w-12 rounded border border-line bg-surface-2 px-1 py-0.5 text-center text-ink outline-none"
              />
              <span>kg</span>
            </form>
          ) : (
            <div className="flex items-center gap-1" onClick={stop}>
              <button
                type="button"
                onClick={() => saveQty(Math.max(1, qty - 1))}
                className="flex h-6 w-6 items-center justify-center rounded border border-line text-ink-muted"
                aria-label="Diminuir quantidade"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="w-5 text-center font-semibold text-ink">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => saveQty(qty + 1)}
                className="flex h-6 w-6 items-center justify-center rounded border border-line text-ink-muted"
                aria-label="Aumentar quantidade"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          )
        ) : (
          <span>
            {item.is_weight
              ? `${formatQty(item.quantity)} kg`
              : `${formatQty(item.quantity)}×`}
          </span>
        )}

        {item.category && <span className="truncate">{item.category.name}</span>}
        {item.note && <span className="truncate">· {item.note}</span>}

        {lineTotal > 0 && (
          <span className="ml-auto font-semibold text-ink-muted">
            {formatBRL(lineTotal)}
          </span>
        )}
      </div>
    </li>
  );
}
