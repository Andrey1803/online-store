import type { Product } from '../data/products';

const GENERIC_LEADING =
  /^(?:насос(?:ный|ная)?|скважинный|дренажный|фекальный|поверхностный|циркуляционный|компрессионная|компрессионный|полипропиленовая|полипропиленовый|шаровый|латунный|электрический|газовый|мембранный|расширительный|гидроаккумулятор|станция|фильтр|труба|муфта|заглушка|тройник|угольник|кран|шланг|бак|картридж|колба|адаптер|оголовок|подводка)\s+/i;

const STOP_TAIL =
  /\s*(?:[(\[]|,|\s-\s|\s—\s|кВт|квт|kW|Вт|вт|W|мм|м³|м3|л\/|литр|bar|бар|DN|G½|G¾|G1|\"|″).*/i;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function trimTail(text: string): string {
  return text.replace(STOP_TAIL, '').replace(/\s+/g, ' ').trim();
}

function limitTokens(text: string, maxTokens: number): string {
  const parts = text.split(/\s+/).filter(Boolean);
  if (parts.length <= maxTokens) return parts.join(' ');
  return parts.slice(0, maxTokens).join(' ');
}

/** Краткое имя для карточки: «IBO 3TI20», «Poelsan 20 мм» */
export function getProductShortTitle(product: Product): string {
  const brand = product.brand?.trim();
  const hasBrand = Boolean(brand && brand !== '—');
  let name = product.name.trim();

  if (hasBrand) {
    const re = new RegExp(`\\b${escapeRegExp(brand!)}\\b`, 'i');
    const match = name.match(re);
    if (match && match.index !== undefined) {
      name = trimTail(name.slice(match.index));
      return limitTokens(name, 4);
    }
    const stripped = trimTail(name.replace(GENERIC_LEADING, ''));
    return limitTokens(`${brand} ${stripped}`, 4);
  }

  let stripped = trimTail(name.replace(GENERIC_LEADING, ''));
  stripped = limitTokens(stripped, 4);
  return stripped || product.name.trim().slice(0, 40);
}

export function getProductCardBrief(product: Product): { brand: string; title: string } {
  const brand = product.brand?.trim() ?? '';
  const hasBrand = brand && brand !== '—';
  const short = getProductShortTitle(product);

  if (!hasBrand) {
    return { brand: '', title: short };
  }

  const brandRe = new RegExp(`^${escapeRegExp(brand)}\\s+`, 'i');
  if (brandRe.test(short)) {
    const model = short.replace(brandRe, '').trim();
    return { brand, title: model || short };
  }

  return { brand, title: short };
}
