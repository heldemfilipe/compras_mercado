"use client";

import { useRef, useState } from "react";
import { Minus, Plus } from "lucide-react";
import { addItem } from "../actions";

type Cat = { id: string; name: string };

export default function AddItemForm({
  purchaseId,
  categories,
}: {
  purchaseId: string;
  categories: Cat[];
}) {
  const ref = useRef<HTMLFormElement>(null);
  const [isWeight, setIsWeight] = useState(false);
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        setPending(true);
        try {
          await addItem(fd);
          ref.current?.reset();
          setQty(1);
          setIsWeight(false);
          ref.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus();
        } finally {
          setPending(false);
        }
      }}
      className="border-t border-line bg-surface p-3"
    >
      <input type="hidden" name="purchase_id" value={purchaseId} />

      <div className="flex gap-2">
        <input
          name="name"
          required
          autoComplete="off"
          placeholder="Produto (ex.: arroz, refri…)"
          className="input flex-1"
        />
        <input
          name="unit_price"
          inputMode="decimal"
          placeholder="R$ 0,00"
          className="input w-28 text-right"
        />
      </div>

      <div className="mt-2 flex items-center gap-2">
        {categories.length > 0 && (
          <select name="category_id" className="input flex-1" defaultValue="">
            <option value="">Sem categoria</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        )}

        {isWeight ? (
          <input
            name="quantity"
            inputMode="decimal"
            defaultValue=""
            placeholder="kg"
            aria-label="Peso em kg"
            className="input w-24 text-center"
          />
        ) : (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="btn-ghost h-10 w-10 !px-0"
              aria-label="Diminuir"
            >
              <Minus className="h-4 w-4" />
            </button>
            <input
              name="quantity"
              readOnly
              value={qty}
              className="w-10 bg-transparent text-center text-[15px] font-semibold"
              aria-label="Quantidade"
            />
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="btn-ghost h-10 w-10 !px-0"
              aria-label="Aumentar"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-ink-muted">
          <input
            type="checkbox"
            name="is_weight"
            checked={isWeight}
            onChange={(e) => setIsWeight(e.target.checked)}
            className="h-4 w-4 accent-[#3b82f6]"
          />
          Por peso (preço por kg)
        </label>
        <button type="submit" className="btn btn-sm" disabled={pending}>
          Incluir
        </button>
      </div>
    </form>
  );
}
