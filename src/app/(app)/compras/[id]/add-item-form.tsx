"use client";

import { useRef, useState } from "react";
import { Minus, Plus, Sparkles } from "lucide-react";
import { guessCategoryName } from "@/lib/categorize";
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
  const [name, setName] = useState("");
  const [catId, setCatId] = useState("");

  const guess = catId === "" ? guessCategoryName(name) : null;
  const hasCat = categories.some((c) => c.name === guess);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        setPending(true);
        try {
          await addItem(fd);
          ref.current?.reset();
          setName("");
          setCatId("");
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
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          name="unit_price"
          inputMode="decimal"
          placeholder="R$ 0,00"
          className="input w-28 text-right"
        />
      </div>

      {guess && (
        <p className="mt-1 flex items-center gap-1 px-1 text-xs text-ink-faint">
          <Sparkles className="h-3 w-3" />
          Categoria automática:{" "}
          <span className="text-ink-muted">{guess}</span>
          {!hasCat && " (será criada)"}
        </p>
      )}

      <div className="mt-2 flex items-center gap-2">
        {categories.length > 0 && (
          <select
            name="category_id"
            className="input flex-1"
            value={catId}
            onChange={(e) => setCatId(e.target.value)}
          >
            <option value="">Automático (pela descrição)</option>
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
