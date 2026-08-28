export const PALETTE = [
  "#3b82f6",
  "#22c55e",
  "#f59e0b",
  "#ef4444",
  "#a855f7",
  "#06b6d4",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#14b8a6",
  "#6366f1",
  "#eab308",
];

export function colorFor(key: string, fallbackIndex = 0): string {
  if (!key) return PALETTE[fallbackIndex % PALETTE.length];
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash << 5) - hash + key.charCodeAt(i);
    hash |= 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

export const CHART_GRID = "#26262c";
export const CHART_AXIS = "#a1a1aa";
export const CHART_TOOLTIP_BG = "#1b1b20";
