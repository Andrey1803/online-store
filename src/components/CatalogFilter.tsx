import { useMemo, useState } from 'react';

import type { CatalogFilters, FilterFacets } from '../lib/catalogFilter';

import { DEFAULT_FILTERS, countActiveFilters, isNumericSpecLabel } from '../lib/catalogFilter';

import { formatPrice } from '../lib/catalog';

import { useHoverCollapse } from '../hooks/useHoverCollapse';

import { CollapsibleFilterBlock } from './CollapsibleFilterBlock';

import './CatalogFilter.css';



interface CatalogFilterProps {

  facets: FilterFacets;

  filters: CatalogFilters;

  onChange: (filters: CatalogFilters) => void;

  onReset: () => void;

  resultCount: number;

  totalCount: number;

  variant?: 'sidebar' | 'main';

}



const SORT_OPTIONS: { value: CatalogFilters['sort']; label: string }[] = [

  { value: 'relevance', label: 'По релевантности' },

  { value: 'price-asc', label: 'Цена: по возрастанию' },

  { value: 'price-desc', label: 'Цена: по убыванию' },

  { value: 'name-asc', label: 'Название: А–Я' },

  { value: 'name-desc', label: 'Название: Я–А' },

];



function FilterBadge({ count }: { count: number }) {

  return <span className="smart-filter-badge">{count}</span>;

}



export function CatalogFilter({

  facets,

  filters,

  onChange,

  onReset,

  resultCount,

  totalCount,

  variant = 'sidebar',

}: CatalogFilterProps) {

  const [brandQuery, setBrandQuery] = useState('');

  const [showAllBrands, setShowAllBrands] = useState(false);

  const [expandedSpecFacets, setExpandedSpecFacets] = useState<Set<string>>(() => new Set());

  const [mobileOpen, setMobileOpen] = useState(false);

  const hover = useHoverCollapse();



  const activeCount = countActiveFilters(filters, facets);



  const visibleBrands = useMemo(() => {

    let list = facets.brands;

    if (brandQuery.trim()) {

      const q = brandQuery.toLowerCase();

      list = list.filter((b) => b.name.toLowerCase().includes(q));

    }

    if (!showAllBrands && !brandQuery) list = list.slice(0, 12);

    return list;

  }, [facets.brands, brandQuery, showAllBrands]);



  const priceMinVal = filters.minPrice ?? facets.priceMin;

  const priceMaxVal = filters.maxPrice ?? facets.priceMax;

  const priceRangeDisabled = facets.priceMax <= facets.priceMin;

  const priceActive =

    (filters.minPrice != null && filters.minPrice > facets.priceMin) ||

    (filters.maxPrice != null && filters.maxPrice < facets.priceMax);



  const patch = (partial: Partial<CatalogFilters>) => onChange({ ...filters, ...partial });



  const toggleBrand = (name: string) => {

    const set = new Set(filters.brands);

    if (set.has(name)) set.delete(name);

    else set.add(name);

    patch({ brands: [...set] });

  };



  const toggleSpec = (label: string, value: string) => {

    const current = new Set(filters.specs[label] ?? []);

    if (current.has(value)) current.delete(value);

    else current.add(value);

    const nextSpecs = { ...filters.specs };

    if (current.size) nextSpecs[label] = [...current];

    else delete nextSpecs[label];

    patch({ specs: nextSpecs });

  };



  const panel = (

    <div className="smart-filter">

      <div className="smart-filter-head">

        <h3>Умный фильтр</h3>

        {activeCount > 0 && (

          <button type="button" className="smart-filter-reset" onClick={onReset}>

            Сбросить ({activeCount})

          </button>

        )}

      </div>



      <label className="smart-filter-field">

        <span>Сортировка</span>

        <select

          value={filters.sort}

          onChange={(e) => patch({ sort: e.target.value as CatalogFilters['sort'] })}

        >

          {SORT_OPTIONS.map((o) => (

            <option key={o.value} value={o.value}>

              {o.label}

            </option>

          ))}

        </select>

      </label>



      {facets.specs.map((specFacet) => {

        const selected = filters.specs[specFacet.label] ?? [];

        const numericFacet = isNumericSpecLabel(specFacet.label);
        const showAllFacet = numericFacet || expandedSpecFacets.has(specFacet.label);
        const visibleValues = showAllFacet
          ? specFacet.values
          : specFacet.values.slice(0, 10);
        const hasMore = !showAllFacet && specFacet.values.length > visibleValues.length;

        const specId = `spec:${specFacet.label}`;



        return (

          <CollapsibleFilterBlock

            key={specFacet.label}

            id={specId}

            isOpen={hover.isOpen(specId)}

            canHover={hover.canHover}

            bind={hover.bind}

            onToggle={() => hover.toggle(specId)}

            className="smart-filter-specs"

            bodyClassName="smart-filter-collapsible-body--compact"

            legend={

              <>

                {specFacet.label}

                {selected.length > 0 && <FilterBadge count={selected.length} />}

              </>

            }

          >

            <ul className="smart-filter-checks smart-filter-checks--compact">

              {visibleValues.map((v) => (

                <li key={v.value}>

                  <label>

                    <input

                      type="checkbox"

                      checked={selected.includes(v.value)}

                      onChange={() => toggleSpec(specFacet.label, v.value)}

                    />

                    <span className="smart-filter-check-label">{v.value}</span>

                    <span className="smart-filter-count">{v.count}</span>

                  </label>

                </li>

              ))}

            </ul>

            {hasMore && (
              <button
                type="button"
                className="smart-filter-spec-more"
                onClick={() =>
                  setExpandedSpecFacets((prev) => new Set(prev).add(specFacet.label))
                }
              >
                Показать ещё {specFacet.values.length - visibleValues.length}
              </button>
            )}

          </CollapsibleFilterBlock>

        );

      })}



      {!priceRangeDisabled && (

        <CollapsibleFilterBlock

          id="price"

          isOpen={hover.isOpen('price')}

          canHover={hover.canHover}

          bind={hover.bind}

          onToggle={() => hover.toggle('price')}

          legend={

            <>

              Цена, BYN

              {priceActive && <FilterBadge count={1} />}

            </>

          }

        >

          <div className="smart-filter-prices">

            <span>{formatPrice(priceMinVal)}</span>

            <span>—</span>

            <span>{formatPrice(priceMaxVal)}</span>

          </div>

          <div className="smart-filter-range-inputs">

            <input

              type="range"

              min={facets.priceMin}

              max={facets.priceMax}

              step={1}

              value={priceMinVal}

              onChange={(e) => {

                const v = Number(e.target.value);

                patch({

                  minPrice: v <= facets.priceMin ? null : v,

                  maxPrice: priceMaxVal < v ? v : filters.maxPrice,

                });

              }}

            />

            <input

              type="range"

              min={facets.priceMin}

              max={facets.priceMax}

              step={1}

              value={priceMaxVal}

              onChange={(e) => {

                const v = Number(e.target.value);

                patch({

                  maxPrice: v >= facets.priceMax ? null : v,

                  minPrice: priceMinVal > v ? v : filters.minPrice,

                });

              }}

            />

          </div>

          <div className="smart-filter-range-labels">

            <span>{facets.priceMin}</span>

            <span>{facets.priceMax}</span>

          </div>

        </CollapsibleFilterBlock>

      )}



      {facets.brands.length > 0 && (

        <CollapsibleFilterBlock

          id="brand"

          isOpen={hover.isOpen('brand')}

          canHover={hover.canHover}

          bind={hover.bind}

          onToggle={() => hover.toggle('brand')}

          className="smart-filter-brands"

          legend={

            <>

              Бренд

              {filters.brands.length > 0 && <FilterBadge count={filters.brands.length} />}

            </>

          }

        >

          {facets.brands.length > 8 && (

            <input

              type="search"

              className="smart-filter-brand-search"

              placeholder="Найти бренд..."

              value={brandQuery}

              onChange={(e) => setBrandQuery(e.target.value)}

            />

          )}

          <ul className="smart-filter-checks">

            {visibleBrands.map((b) => (

              <li key={b.name}>

                <label>

                  <input

                    type="checkbox"

                    checked={filters.brands.includes(b.name)}

                    onChange={() => toggleBrand(b.name)}

                  />

                  <span className="smart-filter-check-label">{b.name}</span>

                  <span className="smart-filter-count">{b.count}</span>

                </label>

              </li>

            ))}

          </ul>

          {facets.brands.length > 12 && !brandQuery && (

            <button

              type="button"

              className="smart-filter-more"

              onClick={() => setShowAllBrands((v) => !v)}

            >

              {showAllBrands ? 'Свернуть' : `Все бренды (${facets.brands.length})`}

            </button>

          )}

        </CollapsibleFilterBlock>

      )}



      <CollapsibleFilterBlock

        id="options"

        isOpen={hover.isOpen('options')}

        canHover={hover.canHover}

        bind={hover.bind}

        onToggle={() => hover.toggle('options')}

        className="smart-filter-toggles-wrap"

        legend={

          <>

            Дополнительно

            {(filters.inStockOnly ? 1 : 0) + (filters.onSaleOnly ? 1 : 0) > 0 && (

              <FilterBadge

                count={(filters.inStockOnly ? 1 : 0) + (filters.onSaleOnly ? 1 : 0)}

              />

            )}

          </>

        }

      >

        <fieldset className="smart-filter-toggles">

          <label className="smart-filter-toggle">

            <input

              type="checkbox"

              checked={filters.inStockOnly}

              onChange={(e) => patch({ inStockOnly: e.target.checked })}

            />

            Только в наличии

          </label>

          <label className="smart-filter-toggle">

            <input

              type="checkbox"

              checked={filters.onSaleOnly}

              onChange={(e) => patch({ onSaleOnly: e.target.checked })}

            />

            Со скидкой

          </label>

        </fieldset>

      </CollapsibleFilterBlock>



      <p className="smart-filter-result">

        Показано <strong>{resultCount}</strong> из {totalCount}

      </p>

    </div>

  );



  if (variant === 'main') {

    return (

      <div className="smart-filter-main-wrap">

        <div className="smart-filter-main-inline">{panel}</div>

        <button

          type="button"

          className="smart-filter-mobile-btn"

          onClick={() => setMobileOpen(true)}

          aria-expanded={mobileOpen}

        >

          Фильтры{activeCount > 0 ? ` (${activeCount})` : ''}

        </button>

        {mobileOpen && (

          <div className="smart-filter-drawer" role="dialog" aria-label="Фильтры">

            <div className="smart-filter-drawer-backdrop" onClick={() => setMobileOpen(false)} />

            <div className="smart-filter-drawer-panel">

              <button

                type="button"

                className="smart-filter-drawer-close"

                onClick={() => setMobileOpen(false)}

                aria-label="Закрыть"

              >

                ×

              </button>

              {panel}

              <button

                type="button"

                className="btn btn-primary smart-filter-apply"

                onClick={() => setMobileOpen(false)}

              >

                Показать {resultCount} товаров

              </button>

            </div>

          </div>

        )}

      </div>

    );

  }



  return <aside className="smart-filter-aside">{panel}</aside>;

}



export { DEFAULT_FILTERS };


