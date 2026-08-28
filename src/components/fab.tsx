import Link from "next/link";
import { Plus } from "lucide-react";

export default function Fab({
  href,
  label = "Adicionar",
}: {
  href: string;
  label?: string;
}) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="fixed bottom-24 left-1/2 z-40 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-2xl bg-accent text-accent-ink shadow-lg shadow-accent/30 transition active:scale-95 sm:left-auto sm:right-[max(1rem,calc(50%-13rem))] sm:translate-x-0"
    >
      <Plus className="h-6 w-6" strokeWidth={2.5} />
    </Link>
  );
}
