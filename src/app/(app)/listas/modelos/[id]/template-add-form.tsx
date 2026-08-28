"use client";

import { useRef } from "react";
import { Plus } from "lucide-react";
import { addTemplateItem } from "../actions";

type Cat = { id: string; name: string };

export default function TemplateAddForm({
  templateId,
  categories,
}: {
  templateId: string;
  categories: Cat[];
}) {
  const ref = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={ref}
      action={async (fd) => {
        await addTemplateItem(fd);
        ref.current?.reset();
        ref.current?.querySelector<HTMLInputElement>('[name="name"]')?.focus();
      }}
      className="flex gap-2"
    >
      <input type="hidden" name="template_id" value={templateId} />
      <input
        name="name"
        required
        autoComplete="off"
        placeholder="Adicionar produto ao modelo…"
        className="input flex-1"
      />
      <input
        name="quantity"
        inputMode="decimal"
        defaultValue="1"
        aria-label="Quantidade"
        className="input w-14 text-center"
      />
      {categories.length > 0 && (
        <select
          name="category_id"
          defaultValue=""
          aria-label="Categoria"
          className="input w-28"
        >
          <option value="">—</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      )}
      <button type="submit" className="btn shrink-0 !px-3" aria-label="Adicionar">
        <Plus className="h-4 w-4" />
      </button>
    </form>
  );
}
