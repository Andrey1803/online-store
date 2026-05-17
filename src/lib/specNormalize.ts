const LABEL_ALIASES: Record<string, string> = {
  объем: 'Объём',
  объём: 'Объём',
  volume: 'Объём',
  'емкость': 'Объём',
  ёмкость: 'Объём',
  мощность: 'Мощность',
  power: 'Мощность',
  подача: 'Подача',
  расход: 'Подача',
  напор: 'Напор',
  давление: 'Давление',
  диаметр: 'Диаметр',
  'тип соединения': 'Тип соединения',
  материал: 'Материал',
  размер: 'Размер',
};

function formatVolumeLiters(liters: number): string {
  const rounded = Math.round(liters * 10) / 10;
  const str = Number.isInteger(rounded) ? String(rounded) : String(rounded);
  return `${str} л`;
}

export function normalizeSpecLabel(label: string): string {
  const trimmed = label.trim();
  if (!trimmed) return trimmed;
  const key = trimmed.toLowerCase();
  return LABEL_ALIASES[key] ?? trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export function normalizeSpecValue(label: string, value: string): string {
  const v = value.trim().replace(/\s+/g, ' ');
  if (!v) return v;

  const canonical = normalizeSpecLabel(label);

  if (canonical === 'Объём') {
    const n = parseLeadingNumber(v);
    if (n != null && n > 0 && n <= 10_000) return formatVolumeLiters(n);
  }

  if (canonical === 'Мощность') {
    const kw = v.match(/([\d]+[,.]?\d*)\s*к\s*вт/i);
    if (kw) return `${kw[1]!.replace(',', '.')} кВт`;
    const w = v.match(/([\d]+[,.]?\d*)\s*вт/i);
    if (w) {
      const n = parseFloat(w[1]!.replace(',', '.'));
      if (n >= 1000) return `${n / 1000} кВт`.replace(/\.0 кВт$/, ' кВт');
      return `${Math.round(n)} Вт`;
    }
  }

  if (canonical === 'Подача') {
    const m = v.match(/([\d]+[,.]?\d*)/);
    if (m) return `${m[1]!.replace(',', '.')} м³/ч`;
  }

  if (canonical === 'Напор' || canonical === 'Давление') {
    const m = v.match(/([\d]+[,.]?\d*)/);
    if (m) {
      const unit = canonical === 'Напор' ? ' м' : ' бар';
      return `${m[1]!.replace(',', '.')}${unit}`;
    }
  }

  if (canonical === 'Диаметр' || canonical === 'Размер') {
    return v
      .replace(/х/g, '×')
      .replace(/X/g, '×')
      .replace(/\s*×\s*/g, '×')
      .replace(/\s*мм\b/i, ' мм')
      .trim();
  }

  return v;
}

export function parseLeadingNumber(value: string): number | null {
  const m = value.replace(',', '.').match(/([\d]+(?:\.\d+)?)/);
  if (!m) return null;
  const n = parseFloat(m[1]!);
  return Number.isNaN(n) ? null : n;
}

export function specValuesEqual(label: string, a: string, b: string): boolean {
  return normalizeSpecValue(label, a) === normalizeSpecValue(label, b);
}
