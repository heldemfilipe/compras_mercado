"use client";

import { useMemo, useRef, useState } from "react";
import { Minus, Plus, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { guessCategoryName } from "@/lib/categorize";
import {
  formatBRL,
  formatMonthShort,
  parseMoneyInput,
  type Unit,
} from "@/lib/format";
import UnitPicker from "@/components/unit-picker";
import type { ProductSuggestion } from "@/lib/queries";
import { addItem } from "../actions";

type Cat = { id: string; name: string };

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim();

export default function AddItemForm({
  purchaseId,
  categories,
  products,
}: {
  purchaseId: string;
  categories: Cat[];
  products: ProductSuggestion[];
}) {
  const ref = useRef<HTMLFormElement>(null);
  const priceRef = useRef<HTMLInputElement>(null);
  const [unit, setUnit] = useState<Unit>("un");
  const [qty, setQty] = useState(1);
  const [pending, setPending] = useState(false);
  const [name, setName] = useState("");
  const [catId, setCatId] = useState("");
  const [price, setPrice] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const [picked, setPicked] = useState<ProductSuggestion | null>(null);

  const matches = useMemo(() => {
    const q = norm(name);
    if (!q) return [];
    return products
      .filter((p) => norm(p.name).includes(q))
      .sort((a, b) => {
        const as = norm(a.name).startsWith(q) ? 0 : 1;
        const bs = norm(b.name).startsWith(q) ? 0 : 1;
        return as - bs || b.times_total - a.times_total;
      })
      .slice(0, 8);
  }, [name, products]);

  // referência p/ comparação: o item escolhido, ou um match exato pelo nome
  const ref0 =
    picked && norm(picked.name) === norm(name)
      ? picked
      : products.find((p) => norm(p.name) === norm(name)) ?? null;

  const priceNum = parseMoneyInput(price);
  const guess = catId === "" && !ref0 ? guessCategoryName(name) : null;

  const cmp = useMemo(() => {
    if (!ref0 || ref0.ref_price == null || priceNum <= 0) return null;
    const base = ref0.ref_price;
    const diff = priceNum - base;
    const pct = (diff / base) * 100;
    const dir = diff > 0.005 ? "up" : diff < -0.005 ? "down" : "flat";
    const isLow = ref0.min_price != null && priceNum <= ref0.min_price + 0.001;
    return { base, diff, pct, dir, isLow, ref0 };
  }, [ref0, priceNum]);

  function choose(p: ProductSuggestion) {
    setName(p.name);
    setCatId(p.category_id ?? "");
    setQty(Math.max(1, Math.round(p.last_qty || 1)));
    setPicked(p);
    setOpen(false);
    setTimeout(() => priceRef.current?.focus(), 0);
  }

  function resetAll() {
    setName("");
    setCatId("");
    setPrice("");
    setQty(1);
    setUnit("un");
    setPicked(null);
    setOpen(false);
  }

  return (
    <form
      ref={ref}
      action={async (fd) => {
        setPending(true);
        try {
          await addItem(fd);
          ref.current?.reset();
          resetAll();
          ref.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus();
        } finally {
          setPending(false);
        }
      }}
      className="border-t border-line bg-surface p-3"
    >
      <input type="hidden" name="purchase_id" value={purchaseId} />

      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            name="name"
            required
            autoComplete="off"
            placeholder="Produto (ex.: arroz, refri…)"
            className="input w-full"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setPicked(null);
              setOpen(true);
              setHi(0);
            }}
            onFocus={() => setOpen(true)}
            onBlur={() => setTimeout(() => setOpen(false), 150)}
            onKeyDown={(e) => {
              if (!open || matches.length === 0) return;
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setHi((h) => Math.min(h + 1, matches.length - 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setHi((h) => Math.max(h - 1, 0));
              } else if (e.key === "Enter") {
                e.preventDefault();
                choose(matches[hi]);
              } else if (e.key === "Escape") {
                setOpen(false);
              }
            }}
          />

          {open && matches.length > 0 && (
            <ul className="absolute bottom-full left-0 right-0 z-50 mb-1 max-h-60 overflow-y-auto rounded-xl border border-line bg-surface-2 shadow-xl">
              {matches.map((p, i) => (
                <li key={p.name}>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(p);
                    }}
                    className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm ${
                      i === hi ? "bg-surface" : ""
                    }`}
                  >
                    {p.category_color && (
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: p.category_color }}
                      />
                    )}
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    {p.ref_price != null && (
                      <span className="shrink-0 text-xs text-ink-faint">
                        {formatBRL(p.ref_price)}
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <input
          ref={priceRef}
          name="unit_price"
          inputMode="decimal"
          placeholder="R$ 0,00"
          className="input w-28 text-right"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
        />
      </div>

      {/* comparação de preço vs última vez */}
      {cmp && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 px-1 text-xs">
          <span
            className={`flex items-center gap-1 font-medium ${
              cmp.dir === "up"
                ? "text-negative"
                : cmp.dir === "down"
                  ? "text-positive"
                  : "text-ink-muted"
            }`}
          >
            {cmp.dir === "up" ? (
              <TrendingUp className="h-3.5 w-3.5" />
            ) : cmp.dir === "down" ? (
              <TrendingDown className="h-3.5 w-3.5" />
            ) : null}
            {cmp.dir !== "flat" && (
              <>
                {cmp.diff > 0 ? "+" : ""}
                {cmp.pct.toFixed(0)}% · {cmp.diff > 0 ? "+" : "−"}
                {formatBRL(Math.abs(cmp.diff))}
              </>
            )}
            {cmp.dir === "flat" && "mesmo preço"}
          </span>
          <span className="text-ink-faint">
            vs{" "}
            {cmp.ref0.ref_date
              ? formatMonthShort(cmp.ref0.ref_date.slice(0, 7))
              : "última vez"}{" "}
            ({formatBRL(cmp.base)})
          </span>
          {cmp.isLow ? (
            <span className="text-positive">· menor preço já pago 🎉</span>
          ) : (
            cmp.ref0.min_price != null && (
              <span className="text-ink-faint">
                · menor {formatBRL(cmp.ref0.min_price)}
              </span>
            )
          )}
        </div>
      )}

      {guess && (
        <p className="mt-1 flex items-center gap-1 px-1 text-xs text-ink-faint">
          <Sparkles className="h-3 w-3" />
          Categoria automática: <span className="text-ink-muted">{guess}</span>
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

        {unit === "un" ? (
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
              className="w-9 bg-transparent text-center text-[15px] font-semibold"
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
        ) : (
          <input
            name="quantity"
            inputMode="decimal"
            defaultValue=""
            placeholder={unit}
            aria-label={`Quantidade em ${unit}`}
            className="input w-16 text-center"
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between">
        <UnitPicker value={unit} onChange={setUnit} name="unit" />
        <button type="submit" className="btn btn-sm" disabled={pending}>
          Incluir
        </button>
      </div>
    </form>
  );
}
