"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreVertical, Archive, Trash2 } from "lucide-react";
import { deleteList, updateListMeta } from "../actions";

export default function ListActions({
  id,
  status,
}: {
  id: string;
  status: "ativa" | "concluida" | "arquivada";
}) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="rounded-lg p-2 text-ink-muted hover:text-ink"
        aria-label="Ações da lista"
      >
        <MoreVertical className="h-5 w-5" />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-1 w-52 overflow-hidden rounded-xl border border-line bg-surface-2 shadow-xl">
            <form
              action={async (fd) => {
                await updateListMeta(fd);
                setOpen(false);
              }}
            >
              <input type="hidden" name="id" value={id} />
              <input
                type="hidden"
                name="status"
                value={status === "arquivada" ? "ativa" : "arquivada"}
              />
              <button className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm hover:bg-surface">
                <Archive className="h-4 w-4" />
                {status === "arquivada" ? "Reativar lista" : "Arquivar lista"}
              </button>
            </form>
            <form
              action={async (fd) => {
                if (!confirm("Excluir esta lista?")) return;
                await deleteList(fd);
                router.push("/listas");
              }}
            >
              <input type="hidden" name="id" value={id} />
              <button className="flex w-full items-center gap-2 border-t border-line px-4 py-3 text-left text-sm text-negative hover:bg-surface">
                <Trash2 className="h-4 w-4" /> Excluir lista
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
