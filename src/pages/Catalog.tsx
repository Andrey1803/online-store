import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Category } from '../data/categories';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  CatalogCategoryBranch,
  isCategoryUnderRoot,
} from '../components/CatalogCategoryTree';
import { ProductCard } from '../components/ProductCard';
import { CatalogFilter, DEFAULT_FILTERS } from '../components/CatalogFilter';
import { useStore } from '../context/StoreContext';
import {
  applyCatalogFilters,
  clampFiltersToFacets,
  filtersToParams,
  getFilterFacets,
  parseFiltersFromParams,
  smartSearchProducts,
  type CatalogFilters,
} from '../lib/catalogFilter';
import './Catalog.css';

export function Catalog() {
  const {
    products,
    mainCategories,
    categories,
    getCategoryBySlug,
    getCategoryById,
    getSubcategories,
    getProductsByCategory,
  } = useStore();
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';
  const [localSearch, setLocalSearch] = useState(q);

  const category = categorySlug ? getCategoryBySlug(categorySlug) : undefined;

  const expandedFromUrl = useMemo(() => {
    const ids = new Set<string>();
    if (!category) return ids;
    let cur: Category | undefined = category;
    ids.add(cur.id);
    while (cur?.parentId) {
      ids.add(cur.parentId);
      cur = getCategoryById(cur.parentId);
    }
    return ids;
  }, [category, getCategoryById]);

  const [manualExpanded, setManualExpanded] = useState<Set<string>>(() => new Set());

  const expandedIds = useMemo(
    () => new Set([...expandedFromUrl, ...manualExpanded]),
    [expandedFromUrl, manualExpanded],
  );

  const toggleExpand = useCallback((id: string) => {
    setManualExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams],
  );

  const baseProducts = useMemo(() => {
    if (q) return smartSearchProducts(products, q);
    if (category) return getProductsByCategory(category.id);
    return products;
  }, [q, category, products, getProductsByCategory]);

  const facets = useMemo(() => getFilterFacets(baseProducts), [baseProducts]);

  const effectiveFilters = useMemo(
    () => clampFiltersToFacets(filters, facets),
    [filters, facets],
  );

  const filtered = useMemo(
    () => applyCatalogFilters(baseProducts, effectiveFilters, q),
    [baseProducts, effectiveFilters, q],
  );

  const updateFilters = useCallback(
    (next: CatalogFilters) => {
      const clamped = clampFiltersToFacets(next, facets);
      const params = filtersToParams(clamped, searchParams);
      setSearchParams(params, { replace: true });
    },
    [facets, searchParams, setSearchParams],
  );

  const resetFilters = useCallback(() => {
    const params = filtersToParams(DEFAULT_FILTERS, searchParams);
    setSearchParams(params, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setLocalSearch(q);
  }, [q]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug, q, effectiveFilters]);

  const resetAll = () => {
    navigate('/catalog');
  };

  return (
    <div className="catalog-page" key={`${categorySlug ?? 'all'}-${q}`}>
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <h2>Каталог</h2>
          <ul className="cat-list">
            <li>
              <Link
                to="/catalog"
                className={!categorySlug ? 'active' : ''}
                onClick={() => setManualExpanded(new Set())}
              >
                Все товары
              </Link>
            </li>
            {mainCategories.map((cat) => {
              const isExpanded = expandedIds.has(cat.id);
              const isActive =
                categorySlug === cat.slug || isCategoryUnderRoot(categories, category, cat.id);

              return (
                <li key={cat.id} className={isExpanded ? 'cat-item-expanded' : ''}>
                  <Link
                    to={`/catalog/${cat.slug}`}
                    className={isActive ? 'active' : ''}
                    onClick={() => toggleExpand(cat.id)}
                  >
                    {cat.icon} {cat.name}
                  </Link>
                  {isExpanded && (
                    <CatalogCategoryBranch
                      parentId={cat.id}
                      depth={0}
                      categorySlug={categorySlug}
                      expandedIds={expandedIds}
                      rootId={cat.id}
                      getSubcategories={getSubcategories}
                      onToggleExpand={toggleExpand}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        </aside>

        <div className="catalog-main">
          <div className="catalog-header">
            <div>
              <h1>{category ? category.name : q ? `Поиск: «${q}»` : 'Весь каталог'}</h1>
              {category && <p>{category.description}</p>}
            </div>
            <form
              className="search-form"
              onSubmit={(e) => {
                e.preventDefault();
                const params = new URLSearchParams(searchParams);
                if (localSearch.trim()) params.set('q', localSearch.trim());
                else params.delete('q');
                navigate(`/catalog?${params.toString()}`);
              }}
            >
              <input
                type="search"
                placeholder="Найти насос, бак, артикул, бренд..."
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
              <button type="submit" className="btn btn-primary">
                Найти
              </button>
            </form>
          </div>

          <CatalogFilter
            variant="main"
            facets={facets}
            filters={effectiveFilters}
            onChange={updateFilters}
            onReset={resetFilters}
            resultCount={filtered.length}
            totalCount={baseProducts.length}
          />

          <p className="catalog-count">Найдено: {filtered.length}</p>

          {filtered.length === 0 ? (
            <div className="empty-state">
              <p>Товары не найдены. Попробуйте изменить фильтры или поисковый запрос.</p>
              <button type="button" className="btn btn-outline" onClick={resetAll}>
                Сбросить всё
              </button>
            </div>
          ) : (
            <div className="product-grid">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
