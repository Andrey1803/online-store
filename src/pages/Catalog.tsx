import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { truncate } from '../lib/seo';
import { STATIC_PAGE_SEO } from '../data/seo';
import { CatalogCategoryBranch, CategoryTreeRow } from '../components/CatalogCategoryTree';
import { isCategoryInTree } from '../lib/catalog';
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

const PAGE_SIZE = 24;

export function Catalog() {
  const {
    products,
    mainCategories,
    categories,
    getCategoryBySlug,
    getSubcategories,
    getProductsByCategory,
  } = useStore();
  const { categorySlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const q = searchParams.get('q') ?? '';
  const [localSearch, setLocalSearch] = useState(q);
  const [page, setPage] = useState(1);

  const category = categorySlug ? getCategoryBySlug(categorySlug) : undefined;

  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set());

  const collapseCategoryTree = useCallback(() => {
    setExpandedIds(new Set());
  }, []);

  /** При выборе раздела — свернуть дерево категорий */
  useEffect(() => {
    collapseCategoryTree();
  }, [categorySlug, collapseCategoryTree]);

  const toggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
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
    setPage(1);
  }, [categorySlug, q, effectiveFilters]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [categorySlug, q, effectiveFilters, page]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, safePage]);

  const resetAll = () => {
    navigate('/catalog');
  };

  const seoTitle = q
    ? `Поиск: ${q}`
    : category
      ? category.name
      : STATIC_PAGE_SEO.catalog.title;
  const seoDescription = q
    ? `Результаты поиска «${q}» в каталоге насосов и оборудования. ${filtered.length} позиций.`
    : category
      ? truncate(`${category.name}: ${category.description}. Каталог ${filtered.length} товаров. Доставка по Минску.`)
      : STATIC_PAGE_SEO.catalog.description;
  const seoPath = q
    ? `/catalog?q=${encodeURIComponent(q)}`
    : category
      ? `/catalog/${category.slug}`
      : STATIC_PAGE_SEO.catalog.path;

  return (
    <div className="catalog-page">
      <PageMeta title={seoTitle} description={seoDescription} path={seoPath} />
      <div className="catalog-layout">
        <aside className="catalog-sidebar">
          <h2>Каталог</h2>
          <nav className="catalog-sidebar-nav" aria-label="Разделы каталога">
          <ul className="cat-list">
            <li>
              <Link
                to="/catalog"
                className={!categorySlug ? 'active' : ''}
                onClick={collapseCategoryTree}
              >
                Все товары
              </Link>
            </li>
            {mainCategories.map((cat) => {
              const catSubs = getSubcategories(cat.id);
              const hasChildren = catSubs.length > 0;
              const isExpanded = expandedIds.has(cat.id);
              const isActive = isCategoryInTree(categories, category, cat.id);

              return (
                <li key={cat.id} className={isExpanded ? 'cat-item-expanded' : ''}>
                  <CategoryTreeRow
                    cat={cat}
                    depth={0}
                    hasChildren={hasChildren}
                    isOpen={isExpanded}
                    isActive={isActive}
                    icon={cat.icon}
                    onToggleExpand={toggleExpand}
                    onCategorySelect={collapseCategoryTree}
                  />
                  {isExpanded && hasChildren && (
                    <CatalogCategoryBranch
                      parentId={cat.id}
                      depth={0}
                      categories={categories}
                      activeCategory={category}
                      expandedIds={expandedIds}
                      getSubcategories={getSubcategories}
                      onToggleExpand={toggleExpand}
                      onCategorySelect={collapseCategoryTree}
                    />
                  )}
                </li>
              );
            })}
          </ul>
          </nav>
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
            <>
              <div className="product-grid">
                {pageItems.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
              {totalPages > 1 && (
                <nav className="catalog-pagination" aria-label="Страницы каталога">
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={safePage <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    ← Назад
                  </button>
                  <span>
                    Страница {safePage} из {totalPages}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    disabled={safePage >= totalPages}
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  >
                    Вперёд →
                  </button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
