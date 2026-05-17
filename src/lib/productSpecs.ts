import type { Product } from '../data/products';
import { normalizeSpecLabel, normalizeSpecValue } from './specNormalize';

export interface ProductSpec {
  label: string;
  value: string;
}

function normNum(s: string): string {
  return s.trim().replace(',', '.');
}

function titleRu(s: string): string {
  const t = s.trim();
  if (!t) return t;
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function isTankContext(text: string): boolean {
  return /гидро|бак|накопител|ёмкост|емкост|расширител|мембран|г\/м|гм-|гв-/i.test(text);
}

function isPumpContext(text: string): boolean {
  return /насос|погружн|скважин|дренаж|к\s*вт|квт|м[³3]\s*\/?\s*ч|погружной/i.test(text);
}

/** «тип соединения заглушка» / «тип соединения муфта соединительная» из описания прайса */
export function parseConnectionType(text: string): string | undefined {
  if (!text?.trim()) return undefined;
  const src = text.replace(/\s+/g, ' ');
  const m = src.match(
    /тип\s*соединения\s*(?:[:—\-]\s*)?([а-яёa-z][а-яёa-z\s\-]*?)(?:\.|,|;|$)/i,
  );
  const raw = m?.[1]?.trim();
  return raw ? titleRu(raw) : undefined;
}

type VolumeHit = { liters: number; priority: number };

/** Все литры из названия/описания */
export function collectVolumeLiters(text: string): number[] {
  if (!text?.trim()) return [];
  const src = text.replace(/\s+/g, ' ');
  const hits: VolumeHit[] = [];
  const seen = new Set<number>();

  const add = (liters: number, priority: number) => {
    if (liters <= 0 || liters > 10_000 || seen.has(liters)) return;
    seen.add(liters);
    hits.push({ liters, priority });
  };

  const explicitPatterns: RegExp[] = [
    /(?:объём|объем|объёмом|объемом)\s*[:,\s]*(?:до\s+)?([\d]+[,.]?\d*)\s*(?:л|литр)/gi,
    /(?:объемом|объёмом)\s+([\d]+[,.]?\d*)\s*(?:литр(?:а|ов)?|л)\b/gi,
    /(?:ёмкост[ьюи]|емкост[ьюи])\s+([\d]+[,.]?\d*)\s*(?:л|литр)/gi,
    /(?:бак|накопител[ья])\s+[^\d]{0,20}?([\d]+[,.]?\d*)\s*(?:л|литр)/gi,
    /\b([\d]+[,.]?\d*)\s*[-–—]\s*([\d]+[,.]?\d*)\s*л\b/gi,
    /\b([\d]+[,.]?\d*)\s*л(?:итр(?:а|ов)?)?\b/gi,
    /\b([\d]+[,.]?\d*)л\b/gi,
    /V\s*[=:]\s*([\d]+[,.]?\d*)\s*л/gi,
  ];

  for (const re of explicitPatterns) {
    let m: RegExpExecArray | null;
    re.lastIndex = 0;
    while ((m = re.exec(src)) !== null) {
      const raw = m[2] !== undefined ? m[2]! : m[1]!;
      const n = parseFloat(raw.replace(',', '.'));
      if (!Number.isNaN(n)) add(n, 1);
    }
  }

  const tankish = isTankContext(src) || (!isPumpContext(src) && /\bГ[МмВв][-. ]?\d/i.test(src));
  if (tankish) {
    const gm = src.matchAll(/\bГ[Мм][-. ]?(\d{1,4})\b/gi);
    for (const m of gm) {
      const n = parseInt(m[1]!, 10);
      if (!Number.isNaN(n)) add(n, 3);
    }
    const gv = src.matchAll(/\bГ[Вв][-. ]?(\d{1,4})\b/gi);
    for (const m of gv) {
      const n = parseInt(m[1]!, 10);
      if (!Number.isNaN(n)) add(n, 3);
    }
  }

  return hits.sort((a, b) => a.priority - b.priority || a.liters - b.liters).map((h) => h.liters);
}

export function parseVolumeLiters(text: string): number | undefined {
  const all = collectVolumeLiters(text);
  return all[0];
}

export function formatVolumeLiters(liters: number): string {
  const rounded = Math.round(liters * 10) / 10;
  const str = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${str} л`;
}

function formatKwFromWatts(watts: number): string {
  if (watts >= 1000) {
    const kw = watts / 1000;
    const rounded = Math.round(kw * 100) / 100;
    return `${String(rounded).replace(/\.0$/, '')} кВт`;
  }
  return `${Math.round(watts)} Вт`;
}

function parseKeyValueSpecs(src: string, add: (label: string, value: string) => void) {
  const re =
    /(?:^|[.;]\s*|\s+)(мощность|подача|расход|напор|давление|объём|объем|диаметр|материал|тип\s+соединения|размер)\s*[:—\-]\s*([^.;]{1,100})/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const rawLabel = m[1]!.trim().toLowerCase();
    let label = normalizeSpecLabel(rawLabel);
    if (rawLabel === 'расход') label = 'Подача';
    const value = m[2]!.trim();
    if (value) add(label, value);
  }
}

/** Из названия и описания прайса (м³/ч, кВт, напор и т.д.) */
export function parseSpecsFromText(text: string): ProductSpec[] {
  if (!text?.trim()) return [];

  const src = text.replace(/\s+/g, ' ');
  const found = new Map<string, string>();

  const add = (label: string, value: string) => {
    const normLabel = normalizeSpecLabel(label);
    const normValue = normalizeSpecValue(normLabel, value);
    if (!normValue) return;
    if (!found.has(normLabel)) found.set(normLabel, normValue);
  };

  parseKeyValueSpecs(src, add);

  const kw =
    src.match(/([\d]+[,.]?\d*)\s*к\s*Вт/i) ?? src.match(/([\d]+[,.]?\d*)\s*kW/i);
  if (kw) {
    add('Мощность', `${normNum(kw[1]!)} кВт`);
  } else {
    const powerPhrase = src.match(
      /(?:мощность|power)\s*[:,\s]+([\d]+[,.]?\d*)\s*(к\s*Вт|Вт|kW|W)/i,
    );
    if (powerPhrase) {
      const n = parseFloat(normNum(powerPhrase[1]!));
      const unit = powerPhrase[2]!.toLowerCase();
      if (!Number.isNaN(n)) {
        if (unit.includes('к') || unit === 'kw') add('Мощность', `${n} кВт`);
        else if (n >= 1000) add('Мощность', formatKwFromWatts(n));
        else add('Мощность', `${Math.round(n)} Вт`);
      }
    }
  }

  const flow =
    src.match(/(?:подача|продача|расход)\s*[:,\s]+([\d]+[,.]?\d*)\s*м[³3]\s*\/?\s*ч/i) ??
    src.match(/([\d]+[,.]?\d*)\s*м[³3]\s*\/?\s*ч(?:ас)?/i);
  if (flow) add('Подача', `${flow[1]!.replace(',', '.')} м³/ч`);

  const head = src.match(/напор\s*[:,\s]+([\d]+[,.]?\d*)\s*м(?:\s|,|\.|$)/i);
  if (head) add('Напор', `${head[1]!.replace(',', '.')} м`);

  const pressure = src.match(/давление\s*[:,\s]+([\d]+[,.]?\d*)\s*(?:бар|bar)/i);
  if (pressure) add('Давление', `${pressure[1]!.replace(',', '.')} бар`);

  for (const liters of collectVolumeLiters(src)) {
    add('Объём', formatVolumeLiters(liters));
    break;
  }

  const size =
    src.match(/размер\s*[:,\s]+([\d]+(?:\s*[xх×]\s*[\d]+)*(?:\s*мм)?)/i) ??
    src.match(/\b([\d]+(?:[.,]\d+)?\s*[xх×]\s*[\d]+(?:[.,]\d+)?)\s*мм\b/i);
  if (size) {
    const d = size[1]!.replace(/\s+/g, ' ').trim();
    add('Размер', d.includes('мм') ? d : `${d} мм`);
  }

  const socketDiam = src.match(
    /диаметр\s+разъема\s+соединения\s+([\d]+(?:\s*[xх×]\s*[\d]+)*(?:\s*мм)?)/i,
  );
  if (socketDiam) {
    const d = socketDiam[1]!.replace(/\s+/g, ' ').trim();
    add('Диаметр', d.includes('мм') ? d : `${d} мм`);
  } else {
    const diameter =
      src.match(/(?:присоединительный\s+)?диаметр\s*[:,\s]+([\d]+[,.]?\d*\s*(?:мм|"|''|″)?)/i) ??
      src.match(/\b(?:DN|ДУ)\s*[-]?\s*([\d]+)\b/i) ??
      src.match(/\b(\d+(?:[.,]\d+)?)\s*["″]\b/);
    if (diameter) {
      const d = diameter[1]!.trim();
      if (/^[\d]+$/.test(d) && diameter[0]!.toUpperCase().includes('DN')) {
        add('Диаметр', `DN${d}`);
      } else if (d.includes('мм')) add('Диаметр', d);
      else if (d.includes('"') || d.includes('″')) add('Диаметр', `${d}"`);
      else add('Диаметр', `${d} мм`);
    }
  }

  const connType = parseConnectionType(src);
  if (connType) add('Тип соединения', connType);

  const material = src.match(/(?:изготовлен[аоы]?\s+из|материал)\s+([а-яёa-z0-9\/\-\s]+?)(?:\.|,|;|$)/i);
  if (material) add('Материал', titleRu(material[1]!));

  const order: string[] = [
    'Мощность',
    'Подача',
    'Напор',
    'Давление',
    'Объём',
    'Диаметр',
    'Размер',
    'Тип соединения',
    'Материал',
  ];
  const specs: ProductSpec[] = [];
  for (const label of order) {
    const value = found.get(label);
    if (value) specs.push({ label, value });
  }
  for (const [label, value] of found) {
    if (!order.includes(label)) specs.push({ label, value });
  }
  return specs;
}

function toNormalizedSpec(spec: ProductSpec): ProductSpec {
  const label = normalizeSpecLabel(spec.label);
  return { label, value: normalizeSpecValue(label, spec.value) };
}

/** Все характеристики товара (сохранённые + дополнение из названия/описания) */
export function getProductSpecs(product: Product): ProductSpec[] {
  const text = `${product.name} ${product.description}`;
  const parsed = parseSpecsFromText(text);
  const fromStored = product.specs
    .filter((s) => s.label.trim() && s.value.trim())
    .map(toNormalizedSpec);

  const map = new Map<string, ProductSpec>();

  for (const s of fromStored) {
    map.set(s.label, s);
  }

  for (const s of parsed.map(toNormalizedSpec)) {
    const prev = map.get(s.label);
    if (!prev) {
      map.set(s.label, s);
      continue;
    }
    if (s.label === 'Объём' && !/\d/.test(prev.value)) {
      map.set(s.label, s);
    }
  }

  const volume = parseVolumeLiters(text);
  if (volume != null) {
    map.set('Объём', { label: 'Объём', value: formatVolumeLiters(volume) });
  }

  const order: string[] = [
    'Мощность',
    'Подача',
    'Напор',
    'Давление',
    'Объём',
    'Диаметр',
    'Размер',
    'Тип соединения',
    'Материал',
  ];

  const ordered: ProductSpec[] = [];
  for (const label of order) {
    const spec = map.get(label);
    if (spec) ordered.push(spec);
  }
  const rest = [...map.entries()]
    .filter(([label]) => !order.includes(label))
    .map(([, spec]) => spec)
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'));

  return [...ordered, ...rest];
}

/** Характеристики для карточки каталога */
export function getProductCardSpecs(product: Product, max = 4): ProductSpec[] {
  return getProductSpecs(product).slice(0, max);
}
