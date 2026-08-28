"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  ShoppingCart,
  ListChecks,
  BarChart3,
  Settings,
} from "lucide-react";

const ITEMS = [
  { href: "/", label: "Início", icon: Home, exact: true },
  { href: "/compras", label: "Compras", icon: ShoppingCart },
  { href: "/listas", label: "Listas", icon: ListChecks },
  { href: "/graficos", label: "Gráficos", icon: BarChart3 },
  { href: "/ajustes", label: "Ajustes", icon: Settings },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Telas de detalhe têm barra de ação própria embaixo — escondemos a navegação.
  const isDetail =
    (/^\/compras\/[^/]+$/.test(pathname) && pathname !== "/compras/nova") ||
    (/^\/listas\/[^/]+$/.test(pathname) && pathname !== "/listas/modelos");
  if (isDetail) return null;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-md items-stretch justify-around px-2 pb-[env(safe-area-inset-bottom)]">
        {ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const active = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors ${
                active ? "text-accent" : "text-ink-faint"
              }`}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={active ? 2.4 : 1.9} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
