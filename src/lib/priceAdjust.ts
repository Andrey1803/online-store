import type { Product } from '../data/products';

/** Округление цены до копеек (минимум 0) */
export function roundPrice(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.round(value * 100) / 100);
}

export function adjustPriceByPercent(price: number, percent: number): number {
  return roundPrice(price * (1 + percent / 100));
}

export function adjustProductPrices(
  product: Product,
  percent: number,
  adjustOldPrice: boolean,
): Product {
  const price = adjustPriceByPercent(product.price, percent);
  const next: Product = { ...product, price };

  if (adjustOldPrice && product.oldPrice != null) {
    const oldPrice = adjustPriceByPercent(product.oldPrice, percent);
    if (oldPrice > price) return { ...next, oldPrice };
    const { oldPrice: _, ...rest } = next;
    return rest;
  }

  if (product.oldPrice != null && product.oldPrice > price) {
    return { ...next, oldPrice: product.oldPrice };
  }

  const { oldPrice: _, ...rest } = next;
  return rest;
}

export function adjustAllProductPrices(
  products: Product[],
  percent: number,
  adjustOldPrice: boolean,
): Product[] {
  return products.map((p) => adjustProductPrices(p, percent, adjustOldPrice));
}
