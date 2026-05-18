import type { Category } from '../data/categories';
import type { Product } from '../data/products';
import { collectCategoryTreeIds } from './catalog';
import { getProductSpecs } from './productSpecs';
import { normalizeSpecLabel, specValuesEqual } from './specNormalize';
import { textContainsFraction } from './fractionParse';

export type AdminProductSort =
  | 'name-asc'
  | 'name-desc'
  | 'brand-asc'
  | 'brand-desc'
  | 'price-asc'
  | 'price-desc'
  | 'category-asc';

export interface AdminProductFilters {
  query: string;
  brand: string;
  categoryId: string;
  specLabel: string;
  specValue: string;
  inStock: 'all' | 'yes' | 'no';
  onSale: 'all' | 'yes' | 'no';
}

export const DEFAULT_ADMIN_PRODUCT_FILTERS: AdminProductFilters = {
  query: '',
  brand: '',
  categoryId: '',
  specLabel: '',
  specValue: '',
  inStock: 'all',
  onSale: 'all',
};

export const ADMIN_SPEC_FILTER_LABELS = [
  'Тип соединения',
  'Диаметр',
  'Размер',
  'Материал',
  'Мощность',
  'Объём',
] as const;

export function categoryDisplayPath(categories: Category[], categoryId: string): string {
  const byId = new Map(categories.map((c) => [c.id, c]));
  const parts: string[] = [];
  let cur = byId.get(categoryId);
  let guard = 0;
  while (cur && guard < 12) {
    parts.unshift(cur.name);
    cur = cur.parentId ? byId.get(cur.parentId) : undefined;
    guard++;
  }
  return parts.join(' → ') || categoryId;
}

function matchesQuery(product: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const tokens = q.split(/\s+/).filter(Boolean);
  const haystack = [
    product.name,
    product.brand,
    product.description,
    product.article ?? '',
    ...getProductSpecs(product).map((s) => `${s.label} ${s.value}`),
  ]
    .join(' ')
    .toLowerCase();
  return tokens.every((t) => haystack.includes(t) || textContainsFraction(haystack, t));
}

function matchesSpec(product: Product, label: string, value: string): boolean {
  if (!label || !value) return true;
  const spec = getProductSpecs(product).find(
    (s) => normalizeSpecLabel(s.label) === normalizeSpecLabel(label),
  );
  if (!spec) return false;
  return specValuesEqual(label, spec.value, value);
}

export function filterAdminProducts(
  products: Product[],
  filters: AdminProductFilters,
  categories: Category[],
): Product[] {
  const categoryIds =
    filters.categoryId ? collectCategoryTreeIds(categories, filters.categoryId) : null;

  return products.filter((p) => {
    if (filters.brand && p.brand !== filters.brand) return false;
    if (categoryIds && !categoryIds.has(p.categoryId)) return false;
    if (filters.inStock === 'yes' && !p.inStock) return false;
    if (filters.inStock === 'no' && p.inStock) return false;
    if (filters.onSale === 'yes' && !(p.oldPrice != null && p.oldPrice > p.price)) return false;
    if (filters.onSale === 'no' && p.oldPrice != null && p.oldPrice > p.price) return false;
    if (!matchesSpec(p, filters.specLabel, filters.specValue)) return false;
    if (!matchesQuery(p, filters.query)) return false;
    return true;
  });
}

export function sortAdminProducts(
  products: Product[],
  sort: AdminProductSort,
  categories: Category[],
): Product[] {
  const copy = [...products];
  const catPath = (id: string) => categoryDisplayPath(categories, id);

  copy.sort((a, b) => {
    switch (sort) {
      case 'name-asc':
        return a.name.localeCompare(b.name, 'ru');
      case 'name-desc':
        return b.name.localeCompare(a.name, 'ru');
      case 'brand-asc':
        return a.brand.localeCompare(b.brand, 'ru') || a.name.localeCompare(b.name, 'ru');
      case 'brand-desc':
        return b.brand.localeCompare(a.brand, 'ru') || a.name.localeCompare(b.name, 'ru');
      case 'price-asc':
        return a.price - b.price || a.name.localeCompare(b.name, 'ru');
      case 'price-desc':
        return b.price - a.price || a.name.localeCompare(b.name, 'ru');
      case 'category-asc':
        return (
          catPath(a.categoryId).localeCompare(catPath(b.categoryId), 'ru') ||
          a.name.localeCompare(b.name, 'ru')
        );
      default:
        return 0;
    }
  });
  return copy;
}

export interface AdminProductFacets {
  brands: { name: string; count: number }[];
  categories: { id: string; label: string; count: number }[];
  specValues: { label: string; values: { value: string; count: number }[] }[];
}

export function buildAdminProductFacets(
  products: Product[],
  categories: Category[],
): AdminProductFacets {
  const brandCounts = new Map<string, number>();
  const categoryCounts = new Map<string, number>();
  const specCounts = new Map<string, Map<string, number>>();

  for (const p of products) {
    const brand = p.brand.trim() || '—';
    if (brand !== '—') brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
    categoryCounts.set(p.categoryId, (categoryCounts.get(p.categoryId) ?? 0) + 1);

    for (const s of getProductSpecs(p)) {
      const label = normalizeSpecLabel(s.label);
      if (!ADMIN_SPEC_FILTER_LABELS.includes(label as (typeof ADMIN_SPEC_FILTER_LABELS)[number])) {
        continue;
      }
      if (!specCounts.has(label)) specCounts.set(label, new Map());
      const vals = specCounts.get(label)!;
      vals.set(s.value, (vals.get(s.value) ?? 0) + 1);
    }
  }

  const brands = [...brandCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'));

  const categoriesFacet = [...categoryCounts.entries()]
    .map(([id, count]) => ({
      id,
      label: categoryDisplayPath(categories, id),
      count,
    }))
    .sort((a, b) => a.label.localeCompare(b.label, 'ru'));

  const specValues = ADMIN_SPEC_FILTER_LABELS.map((label) => {
    const vals = specCounts.get(label);
    if (!vals) return { label, values: [] as { value: string; count: number }[] };
    const values = [...vals.entries()]
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'ru'));
    return { label, values };
  }).filter((s) => s.values.length > 0);

  return { brands, categories: categoriesFacet, specValues };
}

export function countActiveAdminFilters(filters: AdminProductFilters): number {
  let n = 0;
  if (filters.query.trim()) n++;
  if (filters.brand) n++;
  if (filters.categoryId) n++;
  if (filters.specLabel && filters.specValue) n++;
  if (filters.inStock !== 'all') n++;
  if (filters.onSale !== 'all') n++;
  return n;
}
