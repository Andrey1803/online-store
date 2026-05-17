import type { Product } from '../data/products';

/** Ключ одного и того же товара (артикул → slug → id) */
export function getProductIdentityKey(p: Product): string {
  const article = p.article?.trim();
  if (article) return `article:${article.toLowerCase()}`;
  if (p.slug?.trim()) return `slug:${p.slug}`;
  return `id:${p.id}`;
}

const GENERIC_ROOT_IDS = new Set(['komplektuyushchie', 'polipropilen']);

function productRecordScore(p: Product): number {
  let score = 0;
  if (p.image) score += 20;
  if (p.article?.trim()) score += 5;
  if (p.description.length > 40) score += 2;
  score += Math.min(p.specs.length, 8);
  if (p.categoryId && !GENERIC_ROOT_IDS.has(p.categoryId)) score += 3;
  return score;
}

function pickPrimaryRecord(a: Product, b: Product): Product {
  const scoreA = productRecordScore(a);
  const scoreB = productRecordScore(b);
  if (scoreA !== scoreB) return scoreB > scoreA ? b : a;
  if (a.categoryId !== b.categoryId) {
    const aGeneric = GENERIC_ROOT_IDS.has(a.categoryId);
    const bGeneric = GENERIC_ROOT_IDS.has(b.categoryId);
    if (aGeneric && !bGeneric) return b;
    if (bGeneric && !aGeneric) return a;
  }
  return b;
}

/** Объединить две записи одного товара, оставив более полную */
export function mergeProductRecords(a: Product, b: Product): Product {
  const primary = pickPrimaryRecord(a, b);
  const secondary = primary === a ? b : a;
  const article = primary.article?.trim() || secondary.article?.trim();

  return {
    ...secondary,
    ...primary,
    id: article || primary.id || secondary.id,
    article: article || primary.article,
    slug: primary.slug || secondary.slug,
    image: primary.image || secondary.image,
    specs:
      (primary.specs?.length ?? 0) >= (secondary.specs?.length ?? 0)
        ? primary.specs
        : secondary.specs,
    categoryId: primary.categoryId || secondary.categoryId,
    featured: primary.featured || secondary.featured,
    inStock: primary.inStock || secondary.inStock,
  };
}

function dedupePass(
  products: Product[],
  keyFn: (p: Product) => string | null,
): Product[] {
  const map = new Map<string, Product>();
  const order: string[] = [];
  const withoutKey: Product[] = [];

  for (const p of products) {
    const key = keyFn(p);
    if (!key) {
      withoutKey.push(p);
      continue;
    }
    const existing = map.get(key);
    if (!existing) {
      map.set(key, p);
      order.push(key);
    } else {
      map.set(key, mergeProductRecords(existing, p));
    }
  }

  return [...order.map((k) => map.get(k)!), ...withoutKey];
}

/** Убрать дубликаты: сначала по артикулу, затем по slug */
export function deduplicateProducts(products: Product[]): Product[] {
  if (products.length <= 1) return products;

  const withArticle = products.filter((p) => p.article?.trim());
  const withoutArticle = products.filter((p) => !p.article?.trim());

  const mergedByArticle = dedupePass(withArticle, (p) => {
    const a = p.article?.trim();
    return a ? `article:${a.toLowerCase()}` : null;
  });

  const mergedBySlug = dedupePass(
    [...mergedByArticle, ...withoutArticle],
    (p) => (p.slug?.trim() ? `slug:${p.slug}:${p.categoryId}` : null),
  );

  const seenIds = new Set<string>();
  const result: Product[] = [];
  for (const p of mergedBySlug) {
    if (seenIds.has(p.id)) continue;
    seenIds.add(p.id);
    result.push(p);
  }
  return result;
}
