import type { Category } from '../data/categories';
import { defaultCategories } from '../data/categories';
import type { Product } from '../data/products';

const ROOT_CATEGORY_DEFS = defaultCategories.filter((c) => !c.parentId);
const ROOT_CATEGORY_IDS = new Set(ROOT_CATEGORY_DEFS.map((c) => c.id));

/** Корневые разделы каталога (без подкатегорий на верхнем уровне) */
export function getRootCategories(categories: Category[]): Category[] {
  const byId = new Map(categories.map((c) => [c.id, c]));

  return ROOT_CATEGORY_DEFS.map((root) => {
    const live = byId.get(root.id);
    if (live) return { ...root, ...live, parentId: undefined };
    return root;
  });
}

export function getMainCategories(categories: Category[]): Category[] {
  return getRootCategories(categories);
}

export function isRootCategoryId(id: string): boolean {
  return ROOT_CATEGORY_IDS.has(id);
}

/** id корневого раздела для любой категории */
export function getRootCategoryId(categories: Category[], categoryId: string): string {
  const byId = new Map(categories.map((c) => [c.id, c]));
  let current = byId.get(categoryId);
  let guard = 0;
  while (current?.parentId && guard < 20) {
    current = byId.get(current.parentId);
    guard++;
  }
  return current?.id ?? categoryId;
}

export function getCategoryBySlug(categories: Category[], slug: string): Category | undefined {
  const direct = categories.find((c) => c.slug === slug || c.id === slug);
  if (direct) return direct;

  const norm = slug.toLowerCase();
  return categories.find(
    (c) => slugify(c.name) === norm || c.slug.toLowerCase().includes(norm),
  );
}

/** Все id категории и вложенных подкатегорий (любая глубина) */
export function collectCategoryTreeIds(categories: Category[], rootId: string): Set<string> {
  const ids = new Set<string>([rootId]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const c of categories) {
      if (c.parentId && ids.has(c.parentId) && !ids.has(c.id)) {
        ids.add(c.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function getCategoryById(categories: Category[], id: string): Category | undefined {
  return categories.find((c) => c.id === id);
}

export function getSubcategories(categories: Category[], parentId: string): Category[] {
  return categories
    .filter((c) => c.parentId === parentId)
    .sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export function getProductBySlug(products: Product[], slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

export function getProductById(products: Product[], id: string): Product | undefined {
  return products.find((p) => p.id === id);
}

export function getProductsByCategory(
  products: Product[],
  categories: Category[],
  categoryId: string,
): Product[] {
  const ids = collectCategoryTreeIds(categories, categoryId);
  return products.filter((p) => ids.has(p.categoryId));
}

export function searchProducts(products: Product[], query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return products;
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.brand.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q),
  );
}

export function formatPrice(price: number): string {
  return `${price.toFixed(2).replace('.', ',')} BYN`;
}

export function slugify(text: string): string {
  const map: Record<string, string> = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
    щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };
  return text
    .toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80);
}
