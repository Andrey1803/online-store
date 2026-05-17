import type { Product } from '../data/products';
import { parseSpecSortKey, textContainsFraction } from './fractionParse';
import { getProductSpecs } from './productSpecs';
import { normalizeSpecLabel, normalizeSpecValue, specValuesEqual } from './specNormalize';

export type SortOption =
  | 'relevance'
  | 'price-asc'
  | 'price-desc'
  | 'name-asc'
  | 'name-desc';

export interface CatalogFilters {
  brands: string[];
  /** label → выбранные значения (например «Мощность» → ['0.55 кВт']) */
  specs: Record<string, string[]>;
  minPrice: number | null;
  maxPrice: number | null;
  inStockOnly: boolean;
  onSaleOnly: boolean;
  sort: SortOption;
}

export const DEFAULT_FILTERS: CatalogFilters = {
  brands: [],
  specs: {},
  minPrice: null,
  maxPrice: null,
  inStockOnly: false,
  onSaleOnly: false,
  sort: 'relevance',
};

export interface SpecFacet {
  label: string;
  values: { value: string; count: number }[];
}

export interface FilterFacets {
  brands: { name: string; count: number }[];
  specs: SpecFacet[];
  priceMin: number;
  priceMax: number;
}

const SPEC_LABEL_ORDER = [
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

/** Характеристики, значения которых сортируем по числу (от меньшего к большему) */
const NUMERIC_SPEC_LABELS = new Set([
  'Объём',
  'Диаметр',
  'Размер',
  'Мощность',
  'Напор',
  'Давление',
  'Подача',
  'Тип соединения',
]);

export function parseSpecNumericValue(value: string): number | null {
  return parseSpecSortKey(value);
}

export function sortSpecFacetValues(
  label: string,
  values: { value: string; count: number }[],
): { value: string; count: number }[] {
  if (!NUMERIC_SPEC_LABELS.has(label)) {
    return [...values].sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'ru'));
  }

  return [...values].sort((a, b) => {
    const na = parseSpecNumericValue(a.value);
    const nb = parseSpecNumericValue(b.value);
    if (na != null && nb != null) {
      return na - nb || a.value.localeCompare(b.value, 'ru');
    }
    if (na != null) return -1;
    if (nb != null) return 1;
    return a.value.localeCompare(b.value, 'ru');
  });
}

export function isNumericSpecLabel(label: string): boolean {
  return NUMERIC_SPEC_LABELS.has(label);
}

export function getFilterFacets(products: Product[]): FilterFacets {
  const brandCounts = new Map<string, number>();
  const specCounts = new Map<string, Map<string, number>>();
  let priceMin = Infinity;
  let priceMax = 0;

  for (const p of products) {
    const brand = p.brand.trim() || '—';
    if (brand !== '—') {
      brandCounts.set(brand, (brandCounts.get(brand) ?? 0) + 1);
    }
    if (p.price < priceMin) priceMin = p.price;
    if (p.price > priceMax) priceMax = p.price;

    for (const s of getProductSpecs(p)) {
      const label = normalizeSpecLabel(s.label);
      const value = normalizeSpecValue(label, s.value);
      if (!specCounts.has(label)) specCounts.set(label, new Map());
      const values = specCounts.get(label)!;
      values.set(value, (values.get(value) ?? 0) + 1);
    }
  }

  const brands = [...brandCounts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'ru'));

  const specs = [...specCounts.entries()]
    .map(([label, valueMap]) => ({
      label,
      values: sortSpecFacetValues(
        label,
        [...valueMap.entries()].map(([value, count]) => ({ value, count })),
      ),
    }))
    .filter((s) => s.values.length >= 2)
    .sort((a, b) => {
      const ai = SPEC_LABEL_ORDER.indexOf(a.label);
      const bi = SPEC_LABEL_ORDER.indexOf(b.label);
      if (ai >= 0 && bi >= 0) return ai - bi;
      if (ai >= 0) return -1;
      if (bi >= 0) return 1;
      return a.label.localeCompare(b.label, 'ru');
    });

  if (!Number.isFinite(priceMin)) priceMin = 0;
  if (priceMax < priceMin) priceMax = priceMin;

  return {
    brands,
    specs,
    priceMin: Math.floor(priceMin),
    priceMax: Math.ceil(priceMax),
  };
}

function productSearchHaystack(product: Product): string {
  return [
    product.name,
    product.brand,
    product.description,
    product.article ?? '',
    ...getProductSpecs(product).map((s) => `${s.label} ${s.value}`),
  ]
    .join(' ')
    .toLowerCase();
}

function searchScore(product: Product, tokens: string[], haystack: string): number {
  const name = product.name.toLowerCase();
  const brand = product.brand.toLowerCase();
  const article = (product.article ?? '').toLowerCase();
  let score = 0;
  for (const t of tokens) {
    if (article === t) score += 100;
    else if (name.startsWith(t)) score += 40;
    else if (name.includes(t)) score += 20;
    else if (brand.startsWith(t)) score += 15;
    else if (brand.includes(t)) score += 8;
    else if (textContainsFraction(haystack, t)) score += 18;
    else score += 1;
  }
  return score;
}

export function smartSearchProducts(products: Product[], query: string): Product[] {
  const q = query.toLowerCase().trim();
  if (!q) return products;

  const tokens = q.split(/\s+/).filter(Boolean);
  const matched = products.filter((p) => {
    const haystack = productSearchHaystack(p);
    return tokens.every((t) => haystack.includes(t) || textContainsFraction(haystack, t));
  });

  return matched.sort(
    (a, b) =>
      searchScore(b, tokens, productSearchHaystack(b)) -
      searchScore(a, tokens, productSearchHaystack(a)),
  );
}

export function applyCatalogFilters(
  products: Product[],
  filters: CatalogFilters,
  searchQuery?: string,
): Product[] {
  let list = products;

  if (filters.brands.length > 0) {
    const set = new Set(filters.brands.map((b) => b.toLowerCase()));
    list = list.filter((p) => set.has(p.brand.toLowerCase()));
  }

  if (filters.minPrice != null) {
    list = list.filter((p) => p.price >= filters.minPrice!);
  }
  if (filters.maxPrice != null) {
    list = list.filter((p) => p.price <= filters.maxPrice!);
  }
  if (filters.inStockOnly) {
    list = list.filter((p) => p.inStock);
  }
  if (filters.onSaleOnly) {
    list = list.filter((p) => p.oldPrice != null && p.oldPrice > p.price);
  }

  for (const [label, selected] of Object.entries(filters.specs)) {
    if (!selected.length) continue;
    list = list.filter((p) => {
      const spec = getProductSpecs(p).find((s) => normalizeSpecLabel(s.label) === label);
      if (!spec) return false;
      return selected.some((v) => specValuesEqual(label, spec.value, v));
    });
  }

  const sort = searchQuery?.trim() ? filters.sort : filters.sort === 'relevance' ? 'name-asc' : filters.sort;
  return sortProducts(list, sort, searchQuery);
}

function sortProducts(products: Product[], sort: SortOption, searchQuery?: string): Product[] {
  const copy = [...products];
  const q = searchQuery?.trim();

  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return copy.sort((a, b) => b.price - a.price);
    case 'name-desc':
      return copy.sort((a, b) => b.name.localeCompare(a.name, 'ru'));
    case 'name-asc':
      return copy.sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    case 'relevance':
      if (q) {
        const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
        return copy.sort(
          (a, b) =>
            searchScore(b, tokens, productSearchHaystack(b)) -
            searchScore(a, tokens, productSearchHaystack(a)),
        );
      }
      return copy;
    default:
      return copy;
  }
}

export function parseFiltersFromParams(params: URLSearchParams): CatalogFilters {
  const brands = params
    .get('brand')
    ?.split('|')
    .map((b) => decodeURIComponent(b.trim()))
    .filter(Boolean) ?? [];

  const minRaw = params.get('min');
  const maxRaw = params.get('max');
  const sort = params.get('sort') as SortOption | null;

  const validSort: SortOption[] = [
    'relevance',
    'price-asc',
    'price-desc',
    'name-asc',
    'name-desc',
  ];

  const specs: Record<string, string[]> = {};
  const specRaw = params.get('spec');
  if (specRaw) {
    for (const part of specRaw.split('|')) {
      const decoded = decodeURIComponent(part.trim());
      const sep = decoded.indexOf(':');
      if (sep < 0) continue;
      const label = decoded.slice(0, sep);
      const value = decoded.slice(sep + 1);
      if (!label || !value) continue;
      if (!specs[label]) specs[label] = [];
      specs[label].push(value);
    }
  }

  return {
    brands,
    specs,
    minPrice: minRaw != null && minRaw !== '' ? Number(minRaw) : null,
    maxPrice: maxRaw != null && maxRaw !== '' ? Number(maxRaw) : null,
    inStockOnly: params.get('stock') === '1',
    onSaleOnly: params.get('sale') === '1',
    sort: sort && validSort.includes(sort) ? sort : 'relevance',
  };
}

export function filtersToParams(
  filters: CatalogFilters,
  existing: URLSearchParams,
): URLSearchParams {
  const next = new URLSearchParams(existing);

  if (filters.brands.length) {
    next.set('brand', filters.brands.map((b) => encodeURIComponent(b)).join('|'));
  } else {
    next.delete('brand');
  }

  const specParts: string[] = [];
  for (const [label, values] of Object.entries(filters.specs)) {
    for (const value of values) {
      specParts.push(encodeURIComponent(`${label}:${value}`));
    }
  }
  if (specParts.length) next.set('spec', specParts.join('|'));
  else next.delete('spec');

  if (filters.minPrice != null) next.set('min', String(filters.minPrice));
  else next.delete('min');

  if (filters.maxPrice != null) next.set('max', String(filters.maxPrice));
  else next.delete('max');

  if (filters.inStockOnly) next.set('stock', '1');
  else next.delete('stock');

  if (filters.onSaleOnly) next.set('sale', '1');
  else next.delete('sale');

  if (filters.sort && filters.sort !== 'relevance') next.set('sort', filters.sort);
  else next.delete('sort');

  return next;
}

export function countActiveFilters(filters: CatalogFilters, facets: FilterFacets): number {
  let n = 0;
  if (filters.brands.length) n++;
  for (const facet of facets.specs) {
    if ((filters.specs[facet.label]?.length ?? 0) > 0) n++;
  }
  if (filters.inStockOnly) n++;
  if (filters.onSaleOnly) n++;
  if (filters.minPrice != null && filters.minPrice > facets.priceMin) n++;
  if (filters.maxPrice != null && filters.maxPrice < facets.priceMax) n++;
  if (filters.sort !== 'relevance') n++;
  return n;
}

export function clampFiltersToFacets(filters: CatalogFilters, facets: FilterFacets): CatalogFilters {
  let minPrice = filters.minPrice;
  let maxPrice = filters.maxPrice;
  if (minPrice != null && minPrice < facets.priceMin) minPrice = facets.priceMin;
  if (maxPrice != null && maxPrice > facets.priceMax) maxPrice = facets.priceMax;
  if (minPrice != null && maxPrice != null && minPrice > maxPrice) {
    minPrice = facets.priceMin;
    maxPrice = facets.priceMax;
  }
  const validBrands = new Set(facets.brands.map((b) => b.name));
  const specs: Record<string, string[]> = {};
  for (const facet of facets.specs) {
    const validValues = new Set(facet.values.map((v) => v.value));
    const selected = (filters.specs[facet.label] ?? []).filter((v) => validValues.has(v));
    if (selected.length) specs[facet.label] = selected;
  }
  return {
    ...filters,
    minPrice,
    maxPrice,
    brands: filters.brands.filter((b) => validBrands.has(b)),
    specs,
  };
}
