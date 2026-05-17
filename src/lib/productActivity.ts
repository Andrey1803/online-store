import type { Product } from '../data/products';
import { getProductIdentityKey } from './productDedupe';

const VIEWED_KEY = 'akvasnab-recently-viewed';
const CART_ADDS_KEY = 'akvasnab-cart-adds';
const LEGACY_SALES_KEY = 'akvasnab-product-sales';
export const TOP_CART_PRODUCTS_LIMIT = 5;
export const RECENTLY_VIEWED_LIMIT = 5;
const MAX_VIEWED = 24;

export const PRODUCT_ACTIVITY_EVENT = 'akvasnab-product-activity';

function notifyActivityChange() {
  window.dispatchEvent(new Event(PRODUCT_ACTIVITY_EVENT));
}

function loadJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    /* ignore */
  }
  return fallback;
}

export function recordProductView(productId: string) {
  const prev = loadJson<string[]>(VIEWED_KEY, []);
  const next = [productId, ...prev.filter((id) => id !== productId)].slice(0, MAX_VIEWED);
  localStorage.setItem(VIEWED_KEY, JSON.stringify(next));
  notifyActivityChange();
}

export function getRecentlyViewedIds(): string[] {
  return loadJson<string[]>(VIEWED_KEY, []);
}

/** Учитываются только добавления в корзину (не оформление заявки). */
export function recordCartAdds(
  entries: { productId: string; quantity: number }[],
  products: Product[] = [],
) {
  if (entries.length === 0) return;
  const stats = getCartAddStats();
  const byId = new Map(products.map((p) => [p.id, p]));

  for (const { productId, quantity } of entries) {
    if (quantity <= 0) continue;
    stats[productId] = (stats[productId] ?? 0) + quantity;

    const product = byId.get(productId);
    if (!product) continue;
    const key = getProductIdentityKey(product);
    for (const p of products) {
      if (p.id === productId) continue;
      if (getProductIdentityKey(p) !== key) continue;
      const extra = stats[p.id] ?? 0;
      if (extra > 0) {
        stats[productId] = (stats[productId] ?? 0) + extra;
        delete stats[p.id];
      }
    }
  }

  localStorage.setItem(CART_ADDS_KEY, JSON.stringify(stats));
  notifyActivityChange();
}

/** @deprecated используйте recordCartAdds */
export function recordProductSales(entries: { productId: string; quantity: number }[]) {
  recordCartAdds(entries);
}

function getCartAddStats(): Record<string, number> {
  const current = loadJson<Record<string, number>>(CART_ADDS_KEY, {});
  if (Object.keys(current).length > 0) return current;
  return loadJson<Record<string, number>>(LEGACY_SALES_KEY, {});
}

function resolveByIds(products: Product[], ids: string[], limit: number): Product[] {
  const byId = new Map(products.map((p) => [p.id, p]));
  const result: Product[] = [];
  for (const id of ids) {
    const p = byId.get(id);
    if (p && !result.some((x) => getProductIdentityKey(x) === getProductIdentityKey(p))) {
      result.push(p);
      if (result.length >= limit) break;
    }
  }
  return result;
}

export function getRecentlyViewedProducts(products: Product[], limit = 8): Product[] {
  return resolveByIds(products, getRecentlyViewedIds(), limit);
}

/** Топ товаров по числу добавлений в корзину (без подстановки из каталога). */
export function getTopCartProducts(
  products: Product[],
  limit = TOP_CART_PRODUCTS_LIMIT,
): Product[] {
  const stats = getCartAddStats();
  const byId = new Map(products.map((p) => [p.id, p]));
  const merged = new Map<string, { product: Product; count: number }>();

  for (const [productId, count] of Object.entries(stats)) {
    if (count <= 0) continue;
    const p = byId.get(productId);
    if (!p) continue;

    const key = getProductIdentityKey(p);
    const prev = merged.get(key);
    if (!prev) {
      merged.set(key, { product: p, count });
      continue;
    }

    const total = prev.count + count;
    const product = count >= (stats[prev.product.id] ?? 0) ? p : prev.product;
    merged.set(key, { product, count: total });
  }

  const seenIds = new Set<string>();
  return [...merged.values()]
    .sort((a, b) => b.count - a.count || a.product.name.localeCompare(b.product.name, 'ru'))
    .map((x) => x.product)
    .filter((p) => {
      const key = getProductIdentityKey(p);
      if (seenIds.has(key)) return false;
      seenIds.add(key);
      return true;
    })
    .slice(0, limit);
}

/** @deprecated используйте getTopCartProducts */
export function getTopSellingProducts(products: Product[], limit = TOP_CART_PRODUCTS_LIMIT): Product[] {
  return getTopCartProducts(products, limit);
}

export function hasCartAddStats(): boolean {
  return Object.keys(getCartAddStats()).length > 0;
}

/** @deprecated используйте hasCartAddStats */
export function hasSalesStats(): boolean {
  return hasCartAddStats();
}
