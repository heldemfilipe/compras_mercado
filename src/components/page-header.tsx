import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export default function PageHeader({
  title,
  subtitle,
  backHref,
  action,
}: {
  title: string;
  subtitle?: string;
  backHref?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
      <div className="flex items-center gap-2">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Voltar"
            className="-ml-2 rounded-lg p-1.5 text-ink-muted hover:text-ink"
          >
            <ChevronLeft className="h-5 w-5" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-bold tracking-tight">{title}</h1>
          {subtitle && (
            <p className="truncate text-xs text-ink-muted">{subtitle}</p>
          )}
        </div>
        {action}
      </div>
    </header>
  );
}
