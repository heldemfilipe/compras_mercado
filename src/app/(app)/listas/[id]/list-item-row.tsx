"use client";

import { useRef, useState } from "react";
import { Check, Minus, Pencil, Plus, Trash2, X } from "lucide-react";
import { formatBRL, formatAmount, displayAmount, type Unit } from "@/lib/format";
import UnitPicker, { convertAmount } from "@/components/unit-picker";
import MoneyInput from "@/components/money-input";
import {
  deleteListItem,
  renameListItem,
  setListItemField,
  toggleListItem,
} from "../actions";

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
  locked,
}: {
  item: Item;
  listId: string;
  locked: boolean;
}) {
  const [renaming, setRenaming] = useState(false);

  const priceForm = useRef<HTMLFormElement>(null);
  const [priceReais, setPriceReais] = useState(item.unit_price ?? 0);
  const [unit, setUnit] = useState<Unit>(item.unit);
  const [amount, setAmount] = useState(
    String(displayAmount(item.quantity, item.unit)),
  );

  const amountNum = toNum(amount);
  const qtyKg = unit === "g" ? amountNum / 1000 : amountNum;
  const lineTotal = priceReais * (unit === "un" ? amountNum : qtyKg);

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

  /* ------------------------------ RENOMEAR ----------------------------- */
  if (renaming) {
    return (
      <li className="border-b border-line bg-surface-2 p-3 last:border-b-0">
        <form
          action={async (fd) => {
            await renameListItem(fd);
            setRenaming(false);
          }}
          className="flex items-center gap-2"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="list_id" value={listId} />
          <input
            name="name"
            defaultValue={item.name}
            required
            autoFocus
            className="input flex-1"
            placeholder="Nome do produto"
          />
          <button type="submit" className="btn !px-3" aria-label="Salvar nome">
            <Check className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setRenaming(false)}
            className="btn-ghost !px-3"
            aria-label="Cancelar"
          >
            <X className="h-4 w-4" />
          </button>
        </form>

        <form action={deleteListItem} className="mt-2 text-center">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="list_id" value={listId} />
          <button className="text-xs text-negative">
            <Trash2 className="mr-1 inline h-3 w-3" />
            Remover da lista
          </button>
        </form>
      </li>
    );
  }

  /* --------------------------- LINHA COMPACTA -------------------------- */
  return (
    <li
      className={`border-b px-3 py-2.5 transition-colors last:border-b-0 ${
        item.checked
          ? "border-positive/20 bg-positive/15"
          : "border-line bg-surface"
      }`}
    >
      <div className="flex items-center gap-2">
        <form action={toggleListItem} className="flex shrink-0">
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="list_id" value={listId} />
          <input type="hidden" name="checked" value={String(item.checked)} />
          <button
            type="submit"
            disabled={locked}
            aria-label={item.checked ? "Desmarcar" : "Marcar como comprado"}
            className={`flex h-7 w-7 items-center justify-center rounded-md border transition ${
              item.checked
                ? "border-positive bg-positive text-white"
                : "border-line"
            }`}
          >
            {item.checked && <Check className="h-4 w-4" strokeWidth={3} />}
          </button>
        </form>

        <p
          className={`min-w-0 flex-1 truncate text-[15px] ${
            item.checked ? "text-ink-muted line-through" : "font-medium"
          }`}
        >
          {item.name}
        </p>

        {!locked && (
          <button
            type="button"
            onClick={() => setRenaming(true)}
            className="shrink-0 rounded-lg p-1.5 text-ink-faint hover:text-ink"
            aria-label="Renomear"
          >
            <Pencil className="h-4 w-4" />
          </button>
        )}

        {!locked ? (
          <form
            ref={priceForm}
            action={setListItemField}
            className="flex shrink-0 items-center rounded-lg border border-line bg-surface-2 pl-2"
          >
            <input type="hidden" name="id" value={item.id} />
            <input type="hidden" name="list_id" value={listId} />
            <span className="text-xs text-ink-faint">R$</span>
            <MoneyInput
              name="unit_price"
              value={priceReais}
              onValueChange={setPriceReais}
              onBlur={() => priceForm.current?.requestSubmit()}
              ariaLabel={`Preço de ${item.name}`}
              className="w-16 bg-transparent px-1 py-1.5 text-right text-[15px] outline-none placeholder:text-ink-faint"
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

      {/* linha 2: quantidade + unidade + total */}
      <div className="mt-1 flex items-center gap-2 pl-9 text-xs text-ink-faint">
        {!locked ? (
          <>
            {unit === "un" ? (
              <div className="flex items-center gap-1">
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
                aria-label={`Quantidade em ${unit}`}
                className="w-12 rounded border border-line bg-surface-2 px-1 py-0.5 text-center text-ink outline-none"
              />
            )}

            <UnitPicker
              value={unit}
              onChange={(u) =>
                commit(u, String(convertAmount(amountNum, unit, u)))
              }
            />
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
