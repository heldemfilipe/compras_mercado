const BRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

const NUM3 = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 3,
});

export function formatBRL(value: number | null | undefined): string {
  return BRL.format(Number(value ?? 0));
}

export function formatQty(value: number | null | undefined): string {
  return NUM3.format(Number(value ?? 0));
}

/** "2026-08-28" ou Date -> "28 de agosto de 2026" */
export function formatLongDate(input: string | Date): string {
  const d = typeof input === "string" ? parseISODate(input) : input;
  return d.toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function capFirst(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** "2026-08" -> "Agosto de 2026" */
export function formatMonthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  return capFirst(
    d.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }),
  );
}

/** "2026-08" -> "Ago/26" (para eixos de gráfico) */
export function formatMonthShort(month: string): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1, 1);
  const mes = d
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "");
  return `${capFirst(mes)}/${String(y).slice(2)}`;
}

/** Date/ISO -> "2026-08" */
export function toMonthKey(input: string | Date): string {
  const d = typeof input === "string" ? parseISODate(input) : input;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/** "2026-08-28" -> Date local (sem fuso surpresa) */
export function parseISODate(iso: string): Date {
  const [datePart] = iso.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

/** Primeiro dia do mês atual em "YYYY-MM-DD" */
export function firstDayOfCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

export function todayISO(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

/** Converte "12,50" ou "R$ 12,50" em número 12.5 */
export function parseMoneyInput(raw: string): number {
  const cleaned = String(raw)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");
  const n = Number.parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}
