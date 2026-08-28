"use client";

import { useEffect, useMemo, useState } from "react";
import ListItemRow from "./list-item-row";

type Item = {
  id: string;
  name: string;
  quantity: number;
  is_weight: boolean;
  unit: "un" | "kg" | "g";
  unit_price: number | null;
  checked: boolean;
  note: string | null;
  sort_order: number;
  category: { id: string; name: string; color: string | null } | null;
};

type Mode = "cat" | "az" | "new";
const KEY = "compras.list.sort";
const MODES: { id: Mode; label: string }[] = [
  { id: "cat", label: "Categoria" },
  { id: "az", label: "A–Z" },
  { id: "new", label: "Adição" },
];

export default function ListItemsView({
  items,
  listId,
  locked,
}: {
  items: Item[];
  listId: string;
  locked: boolean;
}) {
  const [mode, setMode] = useState<Mode>("cat");

  useEffect(() => {
    try {
      const v = localStorage.getItem(KEY);
      if (v === "cat" || v === "az" || v === "new") setMode(v);
    } catch {
      /* ignore */
    }
  }, []);

  function pick(m: Mode) {
    setMode(m);
    try {
      localStorage.setItem(KEY, m);
    } catch {
      /* ignore */
    }
  }

  const byName = (a: Item, b: Item) =>
    a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });

  const groups = useMemo(() => {
    if (mode === "az") {
      return [{ key: "", label: "", color: null, items: [...items].sort(byName) }];
    }
    if (mode === "new") {
      return [
        {
          key: "",
          label: "",
          color: null,
          items: [...items].sort((a, b) => a.sort_order - b.sort_order),
        },
      ];
    }
    // por categoria
    const map = new Map<
      string,
      { key: string; label: string; color: string | null; items: Item[] }
    >();
    for (const it of items) {
      const label = it.category?.name ?? "Sem categoria";
      const g =
        map.get(label) ??
        { key: label, label, color: it.category?.color ?? null, items: [] };
      g.items.push(it);
      map.set(label, g);
    }
    return [...map.values()]
      .map((g) => ({ ...g, items: g.items.sort(byName) }))
      .sort((a, b) => {
        if (a.label === "Sem categoria") return 1;
        if (b.label === "Sem categoria") return -1;
        return a.label.localeCompare(b.label, "pt-BR");
      });
  }, [items, mode]);

  return (
    <div className="space-y-3">
      <div className="flex gap-1 rounded-xl border border-line bg-surface-2 p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => pick(m.id)}
            className={`flex-1 rounded-lg py-1.5 text-xs font-medium transition ${
              mode === m.id
                ? "bg-accent text-accent-ink"
                : "text-ink-muted"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-ink-muted">
          Lista vazia. Adicione itens pela barra abaixo.
        </p>
      ) : (
        groups.map((g) => {
          const done = g.items.filter((i) => i.checked).length;
          return (
            <div key={g.key || "all"}>
              {g.label && (
                <div className="mb-1.5 flex items-center gap-2 px-1">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: g.color ?? "#52525b" }}
                  />
                  <span className="text-xs font-semibold text-ink-muted">
                    {g.label}
                  </span>
                  <span className="text-xs text-ink-faint">
                    {done}/{g.items.length}
                  </span>
                </div>
              )}
              <ul className="overflow-hidden rounded-2xl border border-line">
                {g.items.map((it) => (
                  <ListItemRow
                    key={it.id}
                    item={it}
                    listId={listId}
                    locked={locked}
                  />
                ))}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}
