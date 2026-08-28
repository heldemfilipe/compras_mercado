"use client";

import { useState } from "react";
import { ShoppingCart } from "lucide-react";
import { convertListToPurchase } from "./actions";

export default function RegisterPurchaseButton({
  listId,
  total,
  checked,
}: {
  listId: string;
  total: number;
  checked: number;
}) {
  const [busy, setBusy] = useState(false);

  return (
    <form
      action={async (fd) => {
        const which =
          checked > 0
            ? `os ${checked} itens marcados`
            : `todos os ${total} itens`;
        if (
          !confirm(
            `Registrar a compra do mês com ${which}?\n\n` +
              `A lista vira a compra e você completa os preços na tela da compra.`,
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
    >
      <input type="hidden" name="id" value={listId} />
      <button type="submit" className="btn btn-sm w-full" disabled={busy}>
        <ShoppingCart className="h-4 w-4" />
        {busy ? "Registrando…" : "Registrar como compra do mês"}
      </button>
    </form>
  );
}
