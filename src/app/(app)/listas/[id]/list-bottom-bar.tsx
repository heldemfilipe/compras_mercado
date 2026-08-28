"use client";

import { useRef, useState } from "react";
import { Minus, Plus, Sparkles } from "lucide-react";
import { guessCategoryName } from "@/lib/categorize";
import type { Unit } from "@/lib/format";
import UnitPicker from "@/components/unit-picker";
import { addListItem } from "../actions";

export default function ListBottomBar({ listId }: { listId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");
  const [unit, setUnit] = useState<Unit>("un");
  const [qty, setQty] = useState(1);
  const [amount, setAmount] = useState("");

  const guess = guessCategoryName(name);
  const qtyValue = unit === "un" ? String(qty) : amount || "0";

  function reset() {
    setName("");
    setPrice("");
    setUnit("un");
    setQty(1);
    setAmount("");
    ref.current?.reset();
  }

  return (
    <div className="border-t border-line bg-surface p-3">
      <form
        ref={ref}
        action={async (fd) => {
          await addListItem(fd);
          reset();
          ref.current
            ?.querySelector<HTMLInputElement>('[name="name"]')
            ?.focus();
        }}
        className="space-y-2"
      >
        <input type="hidden" name="list_id" value={listId} />
        <input type="hidden" name="unit" value={unit} />
        <input type="hidden" name="quantity" value={qtyValue} />

        <input
          name="name"
          required
          autoComplete="off"
          placeholder="Produto"
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        <div className="flex items-center gap-2">
          <div className="relative w-24 shrink-0">
            <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-ink-faint">
              R$
            </span>
            <input
              name="unit_price"
              inputMode="decimal"
              placeholder="0,00"
              aria-label="Valor unitário"
              className="input w-full pl-8 pr-2 text-right"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
            />
          </div>

          {unit === "un" ? (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="btn-ghost h-9 w-9 !px-0"
                aria-label="Diminuir"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-6 text-center text-[15px] font-semibold">
                {qty}
              </span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                className="btn-ghost h-9 w-9 !px-0"
                aria-label="Aumentar"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={unit === "kg" ? "kg" : "g"}
              aria-label={`Quantidade em ${unit}`}
              className="input w-16 text-center"
            />
          )}

          <UnitPicker value={unit} onChange={setUnit} />
        </div>

        {guess && name.trim().length >= 2 && (
          <p className="flex items-center gap-1 px-1 text-xs text-ink-faint">
            <Sparkles className="h-3 w-3" />
            <span className="text-ink-muted">{guess}</span>
          </p>
        )}

        <button type="submit" className="btn w-full">
          <Plus className="h-4 w-4" />
          Incluir
        </button>
      </form>
    </div>
  );
}
