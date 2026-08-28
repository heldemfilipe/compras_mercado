"use client";

import { useState } from "react";
import { Pencil, Trash2, X } from "lucide-react";
import { formatAmount, displayAmount, type Unit } from "@/lib/format";
import UnitPicker, { convertAmount } from "@/components/unit-picker";
import { deleteTemplateItem, updateTemplateItem } from "../actions";

type Cat = { id: string; name: string };
type Item = {
  id: string;
  name: string;
  quantity: number;
  is_weight: boolean;
  unit: Unit;
  category: { id: string; name: string; color: string | null } | null;
};

const toNum = (s: string) => {
  const n = Number(String(s).replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
};

export default function TemplateItemRow({
  item,
  templateId,
  categories,
}: {
  item: Item;
  templateId: string;
  categories: Cat[];
}) {
  const [editing, setEditing] = useState(false);
  const [eUnit, setEUnit] = useState<Unit>(item.unit);
  const [eAmt, setEAmt] = useState(
    String(displayAmount(item.quantity, item.unit)),
  );

  if (editing) {
    return (
      <li className="border-b border-line bg-surface-2 p-3 last:border-b-0">
        <form
          action={async (fd) => {
            await updateTemplateItem(fd);
            setEditing(false);
          }}
          className="space-y-2"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="template_id" value={templateId} />
          <input type="hidden" name="unit" value={eUnit} />
          <input
            name="name"
            defaultValue={item.name}
            required
            className="input"
          />
          <div className="flex items-center gap-2">
            <input
              name="quantity"
              inputMode="decimal"
              value={eAmt}
              onChange={(e) => setEAmt(e.target.value)}
              aria-label="Quantidade"
              className="input w-16 text-center"
            />
            <UnitPicker
              value={eUnit}
              onChange={(u) => {
                setEAmt(String(convertAmount(toNum(eAmt), eUnit, u)));
                setEUnit(u);
              }}
            />
          </div>
          {categories.length > 0 && (
            <select
              name="category_id"
              defaultValue={item.category?.id ?? ""}
              className="input"
            >
              <option value="">Automático (pela descrição)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
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
          action={deleteTemplateItem}
          className="mt-2 border-t border-line pt-2 text-center"
        >
          <input type="hidden" name="id" value={item.id} />
          <input type="hidden" name="template_id" value={templateId} />
          <button className="text-sm text-negative">
            <Trash2 className="mr-1 inline h-3.5 w-3.5" />
            Remover do modelo
          </button>
        </form>
      </li>
    );
  }

  return (
    <li className="flex items-center gap-3 border-b border-line bg-surface px-4 py-3 last:border-b-0">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-xs text-ink-muted">
          {formatAmount(item.quantity, item.unit)}
          {item.category ? ` · ${item.category.name}` : ""}
        </p>
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 rounded-lg p-2 text-ink-faint hover:text-ink"
        aria-label="Editar item"
      >
        <Pencil className="h-4 w-4" />
      </button>
    </li>
  );
}
