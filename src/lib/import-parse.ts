/**
 * Interpreta um texto colado (ex.: itens do app SOMA) numa lista de produtos.
 * Aceita vários formatos, um item por linha OU no estilo do SOMA (duas linhas):
 *
 *   2x R$ 3,99 refri
 *   2 x 3,99 refri
 *   refri 2 3,99
 *   refri; 2; 3,99
 *   refri - 3,99            (quantidade = 1)
 *   1x R$ 11,99             \  estilo SOMA: valor numa linha,
 *   chocolate              /   nome na linha seguinte
 */

export interface ParsedItem {
  name: string;
  qty: number;
  price: number;
}

function toNumber(raw: string): number {
  const s = String(raw).trim();
  if (!s) return 0;
  // "1.234,56" -> "1234.56" ; "11,99" -> "11.99" ; "11.99" -> "11.99"
  let cleaned = s.replace(/\s/g, "");
  if (cleaned.includes(",")) {
    cleaned = cleaned.replace(/\./g, "").replace(",", ".");
  }
  const n = Number.parseFloat(cleaned.replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

const PRICE_ONLY = /^(?:r\$\s*)?[\d.,]+$/i;

export function parseImportText(text: string): ParsedItem[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  const items: ParsedItem[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // linha só com "R$ 11,99" (total solto do SOMA) -> ignora
    if (PRICE_ONLY.test(line) && !/x/i.test(line)) continue;

    // "2x R$ 3,99 [R$ 7,98] [nome]"  (nome opcional na mesma linha)
    const somaHead = line.match(
      /^(\d+(?:[.,]\d+)?)\s*x\s*(?:r\$\s*)?([\d.,]+)\s*(?:r\$\s*[\d.,]+)?\s*(.*)$/i,
    );
    if (somaHead) {
      const qty = toNumber(somaHead[1]) || 1;
      const price = toNumber(somaHead[2]);
      let name = somaHead[3].trim();
      if (!name && i + 1 < lines.length && !PRICE_ONLY.test(lines[i + 1])) {
        name = lines[++i].trim();
      }
      items.push({ name: name || "(sem nome)", qty, price });
      continue;
    }

    // "nome 2 x 3,99"  /  "nome 2 3,99"
    let m =
      line.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s*x\s*(?:r\$\s*)?([\d.,]+)$/i) ||
      line.match(/^(.+?)\s+(\d+(?:[.,]\d+)?)\s+(?:r\$\s*)?(\d[\d.,]*)$/i);
    if (m) {
      items.push({
        name: m[1].trim(),
        qty: toNumber(m[2]) || 1,
        price: toNumber(m[3]),
      });
      continue;
    }

    // "nome; 2; 3,99"  /  "nome | 3,99"  /  "nome, 2, 3,99"  (tab também)
    const parts = line.split(/\s*[;|\t]\s*|\s*,\s*(?=\d)/).filter(Boolean);
    if (parts.length >= 2) {
      const name = parts[0].trim();
      if (parts.length >= 3) {
        items.push({
          name,
          qty: toNumber(parts[1]) || 1,
          price: toNumber(parts[2]),
        });
      } else {
        items.push({ name, qty: 1, price: toNumber(parts[1]) });
      }
      continue;
    }

    // "nome - 3,99"  /  "nome  3,99"  (preço no fim, quantidade 1)
    m = line.match(/^(.+?)\s*[-–—]?\s*(?:r\$\s*)?(\d+[.,]\d{2})$/i);
    if (m) {
      items.push({ name: m[1].trim(), qty: 1, price: toNumber(m[2]) });
      continue;
    }

    // sobrou só um nome
    items.push({ name: line, qty: 1, price: 0 });
  }

  return items.filter((it) => it.name && it.name !== "(sem nome)");
}
