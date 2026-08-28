"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { formatBRL } from "@/lib/format";
import { convertListToPurchase } from "../actions";

export default function RegisterPurchaseFab({
  listId,
  total,
  itemCount,
  checkedCount,
}: {
  listId: string;
  total: number;
  itemCount: number;
  checkedCount: number;
}) {
  const [busy, setBusy] = useState(false);
  if (itemCount === 0) return null;

  return (
    <form
      action={async (fd) => {
        const which =
          checkedCount > 0
            ? `os ${checkedCount} itens marcados`
            : `todos os ${itemCount} itens`;
        if (
          !confirm(
            `Finalizar e registrar a compra do mês com ${which}?\n\n` +
              `A lista vira a compra${
                total > 0 ? ` (${formatBRL(total)})` : ""
              }.`,
          )
        )
          return;
        setBusy(true);
        try {
          await convertListToPurchase(fd);
        } finally {
          setBusy(false);
        }
      }}
      className="fixed bottom-[150px] right-4 z-50"
    >
      <input type="hidden" name="id" value={listId} />
      <button
        type="submit"
        disabled={busy}
        className="flex items-center gap-2 rounded-full bg-accent py-3 pl-4 pr-5 text-sm font-bold text-accent-ink shadow-lg shadow-accent/30 transition active:scale-95 disabled:opacity-60"
      >
        <ShoppingCart className="h-5 w-5" strokeWidth={2.4} />
        {busy ? "…" : total > 0 ? formatBRL(total) : "Finalizar"}
      </button>
    </form>
  );
}
