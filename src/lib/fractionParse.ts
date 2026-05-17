/** Дробь или смешанное число → десятичное (для сортировки и сравнения) */
export function parseFractionDecimal(input: string): number | null {
  const s = input
    .trim()
    .replace(/[""″''`]/g, '')
    .replace(/,/g, '.')
    .replace(/\u2212/g, '-');
  if (!s) return null;

  let m = s.match(/^(\d+)\s*[-\s]\s*(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const den = Number(m[3]);
    if (den) return Number(m[1]) + Number(m[2]) / den;
  }

  m = s.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (m) {
    const den = Number(m[2]);
    if (den) return Number(m[1]) / den;
  }

  m = s.match(/^(\d+(?:\.\d+)?)$/);
  if (m) {
    const n = parseFloat(m[1]);
    return Number.isNaN(n) ? null : n;
  }

  return null;
}

/** Числовой ключ для сортировки значений фильтра (дроби, 32×1 1/2, мм) */
export function parseSpecSortKey(value: string): number | null {
  const v = value.replace(/×/g, 'x').trim();

  const mixedInCombo = v.match(/x\s*(\d+)\s*[-\s]\s*(\d+)\s*\/\s*(\d+)/i);
  if (mixedInCombo) {
    const den = Number(mixedInCombo[3]);
    if (den) return Number(mixedInCombo[1]) + Number(mixedInCombo[2]) / den;
  }

  const fracInCombo = v.match(/x\s*(\d+)\s*\/\s*(\d+)/i);
  if (fracInCombo) {
    const den = Number(fracInCombo[2]);
    if (den) return Number(fracInCombo[1]) / den;
  }

  const embeddedMixed = v.match(/(\d+)\s*[-\s]\s*(\d+)\s*\/\s*(\d+)/);
  if (embeddedMixed) {
    const den = Number(embeddedMixed[3]);
    if (den) return Number(embeddedMixed[1]) + Number(embeddedMixed[2]) / den;
  }

  const embeddedFrac = v.match(/(\d+)\s*\/\s*(\d+)/);
  if (embeddedFrac) {
    const den = Number(embeddedFrac[2]);
    if (den) return Number(embeddedFrac[1]) / den;
  }

  const mm = v.match(/(\d+(?:[.,]\d+)?)\s*мм/i);
  if (mm) {
    const n = parseFloat(mm[1].replace(',', '.'));
    if (!Number.isNaN(n)) return n;
  }

  const dec = parseFractionDecimal(v);
  if (dec != null) return dec;

  const fallback = v.replace(',', '.').match(/([\d.]+)/);
  if (fallback) {
    const n = parseFloat(fallback[1]);
    if (!Number.isNaN(n)) return n;
  }
  return null;
}

function collectFractions(text: string): number[] {
  const found: number[] = [];
  const seen = new Set<number>();

  const add = (n: number) => {
    if (!Number.isFinite(n) || n <= 0 || seen.has(n)) return;
    seen.add(n);
    found.push(n);
  };

  const mixedRe = /(\d+)\s*[-\s]\s*(\d+)\s*\/\s*(\d+)/g;
  let m: RegExpExecArray | null;
  while ((m = mixedRe.exec(text)) !== null) {
    const den = Number(m[3]);
    if (den) add(Number(m[1]) + Number(m[2]) / den);
  }

  const fracRe = /(\d+)\s*\/\s*(\d+)/g;
  while ((m = fracRe.exec(text)) !== null) {
    const den = Number(m[2]);
    if (den) add(Number(m[1]) / den);
  }

  return found;
}

export function normalizeInchFractionText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[""″]/g, '')
    .replace(/(\d+)\s*[-\s]\s*(\d+)\s*\/\s*(\d+)/g, '$1-$2/$3')
    .replace(/(\d+)\s*\/\s*(\d+)/g, '$1/$2');
}

/** Поиск: 3/4, 1-1/2, 1 1/2 — не только целые числа */
export function textContainsFraction(haystack: string, token: string): boolean {
  const hNorm = normalizeInchFractionText(haystack);
  const tNorm = normalizeInchFractionText(token);
  if (hNorm.includes(tNorm)) return true;

  const target = parseFractionDecimal(token) ?? parseSpecSortKey(token);
  if (target == null) return false;

  return collectFractions(haystack).some((n) => Math.abs(n - target) < 0.02);
}
