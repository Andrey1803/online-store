import type { Category } from '../data/categories';
import { defaultCategories } from '../data/categories';
import type { Product } from '../data/products';
import { getCategoryDepth } from './catalog';

const ROOT_IDS = new Set(
  defaultCategories.filter((c) => !c.parentId).map((c) => c.id),
);

/** Ключ одного и того же товара (артикул → slug → id) */
export function getProductIdentityKey(p: Product): string {
  const article = p.article?.trim();
  if (article) return `article:${article.toLowerCase()}`;
  if (p.slug?.trim()) return `slug:${p.slug}`;
  return `id:${p.id}`;
}

function productRecordScore(p: Product, categories: Category[]): number {
  let score = 0;
  if (p.image) score += 20;
  if (p.article?.trim()) score += 5;
  if (p.description.length > 40) score += 2;
  score += Math.min(p.specs.length, 8);
  const depth = getCategoryDepth(categories, p.categoryId);
  if (depth > 0) score += 2 + depth;
  if (p.categoryId && !ROOT_IDS.has(p.categoryId)) score += 3;
  return score;
}

function pickPrimaryRecord(a: Product, b: Product, categories: Category[]): Product {
  const scoreA = productRecordScore(a, categories);
  const scoreB = productRecordScore(b, categories);
  if (scoreA !== scoreB) return scoreB > scoreA ? b : a;
  if (a.categoryId !== b.categoryId) {
    const depthA = getCategoryDepth(categories, a.categoryId);
    const depthB = getCategoryDepth(categories, b.categoryId);
    if (depthA !== depthB) return depthB > depthA ? b : a;
    const aRoot = ROOT_IDS.has(a.categoryId);
    const bRoot = ROOT_IDS.has(b.categoryId);
    if (aRoot && !bRoot) return b;
    if (bRoot && !aRoot) return a;
  }
  return b;
}

/** Объединить две записи одного товара, оставив более полную */
export function mergeProductRecords(
  a: Product,
  b: Product,
  categories: Category[] = defaultCategories,
): Product {
  const primary = pickPrimaryRecord(a, b, categories);
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
  categories: Category[],
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
      map.set(key, mergeProductRecords(existing, p, categories));
    }
  }

  return [...order.map((k) => map.get(k)!), ...withoutKey];
}

/** Убрать дубликаты: сначала по артикулу, затем по slug */
export function deduplicateProducts(
  products: Product[],
  categories: Category[] = defaultCategories,
): Product[] {
  if (products.length <= 1) return products;

  const withArticle = products.filter((p) => p.article?.trim());
  const withoutArticle = products.filter((p) => !p.article?.trim());

  const mergedByArticle = dedupePass(
    withArticle,
    (p) => {
      const a = p.article?.trim();
      return a ? `article:${a.toLowerCase()}` : null;
    },
    categories,
  );

  const mergedBySlug = dedupePass(
    [...mergedByArticle, ...withoutArticle],
    (p) => (p.slug?.trim() ? `slug:${p.slug}:${p.categoryId}` : null),
    categories,
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
