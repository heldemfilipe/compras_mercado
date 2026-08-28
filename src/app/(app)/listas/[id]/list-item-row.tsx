"use client";

import { useRef, useState } from "react";
import { Check, Minus, Plus, Trash2, X } from "lucide-react";
import { formatBRL, formatAmount, displayAmount, type Unit } from "@/lib/format";
import UnitPicker, { convertAmount } from "@/components/unit-picker";
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
  unit: Unit;
  unit_price: number | null;
  checked: boolean;
  note: string | null;
  category: { id: string; name: string; color: string | null } | null;
};

const toNum = (s: string) => {
  const n = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
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
  const [editUnit, setEditUnit] = useState<Unit>(item.unit);
  const [editAmount, setEditAmount] = useState(
    String(displayAmount(item.quantity, item.unit)),
  );

  // linha compacta
  const priceForm = useRef<HTMLFormElement>(null);
  const [price, setPrice] = useState(
    item.unit_price == null ? "" : String(item.unit_price).replace(".", ","),
  );
  const [unit, setUnit] = useState<Unit>(item.unit);
  const [amount, setAmount] = useState(
    String(displayAmount(item.quantity, item.unit)),
  );

  const amountNum = toNum(amount);
  const qtyKg = unit === "g" ? amountNum / 1000 : amountNum;
  const lineTotal = toNum(price) * (unit === "un" ? amountNum : qtyKg);

  async function commit(nextUnit: Unit, nextAmount: string) {
    setUnit(nextUnit);
    setAmount(nextAmount);
    const fd = new FormData();
    fd.set("id", item.id);
    fd.set("list_id", listId);
    fd.set("unit", nextUnit);
    fd.set("quantity", nextAmount || "0");
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
          <input type="hidden" name="unit" value={editUnit} />

          <input
            name="name"
            defaultValue={item.name}
            required
            autoFocus
            className="input"
            placeholder="Produto"
          />

          <div className="flex items-center gap-2">
            {editUnit === "un" ? (
              <input
                name="quantity"
                inputMode="numeric"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                aria-label="Quantidade"
                className="input w-16 text-center"
              />
            ) : (
              <input
                name="quantity"
                inputMode="decimal"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                placeholder={editUnit}
                aria-label={`Quantidade em ${editUnit}`}
                className="input w-16 text-center"
              />
            )}

            <UnitPicker
              value={editUnit}
              onChange={(u) => {
                setEditAmount(String(convertAmount(toNum(editAmount), editUnit, u)));
                setEditUnit(u);
              }}
            />

            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">
                R$
              </span>
              <input
                name="unit_price"
                inputMode="decimal"
                defaultValue={price}
                placeholder="0,00"
                aria-label={editUnit === "un" ? "Valor unitário" : "Valor por kg"}
                className="input w-full pl-9 text-right"
              />
            </div>
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
            className="flex shrink-0 items-center rounded-lg border border-line bg-surface-2 pl-2"
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

      {/* segunda linha: quantidade + unidade + total */}
      <div className="mt-1 flex items-center gap-2 pl-9 text-xs text-ink-faint">
        {!locked ? (
          <>
            {unit === "un" ? (
              <div className="flex items-center gap-1" onClick={stop}>
                <button
                  type="button"
                  onClick={() =>
                    commit("un", String(Math.max(1, Math.round(amountNum) - 1)))
                  }
                  className="flex h-6 w-6 items-center justify-center rounded border border-line text-ink-muted"
                  aria-label="Diminuir"
                >
                  <Minus className="h-3 w-3" />
                </button>
                <span className="w-5 text-center font-semibold text-ink">
                  {Math.round(amountNum) || 1}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    commit("un", String(Math.round(amountNum) + 1))
                  }
                  className="flex h-6 w-6 items-center justify-center rounded border border-line text-ink-muted"
                  aria-label="Aumentar"
                >
                  <Plus className="h-3 w-3" />
                </button>
              </div>
            ) : (
              <input
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                onBlur={() => commit(unit, amount)}
                onClick={stop}
                aria-label={`Quantidade em ${unit}`}
                className="w-12 rounded border border-line bg-surface-2 px-1 py-0.5 text-center text-ink outline-none"
              />
            )}

            <div onClick={stop}>
              <UnitPicker
                value={unit}
                onChange={(u) =>
                  commit(u, String(convertAmount(amountNum, unit, u)))
                }
              />
            </div>
          </>
        ) : (
          <span>{formatAmount(item.quantity, item.unit)}</span>
        )}

        {item.category && (
          <span className="min-w-0 truncate">{item.category.name}</span>
        )}
        {item.note && <span className="min-w-0 truncate">· {item.note}</span>}

        {lineTotal > 0 && (
          <span className="ml-auto shrink-0 font-semibold text-ink-muted">
            {formatBRL(lineTotal)}
          </span>
        )}
      </div>
    </li>
  );
}
