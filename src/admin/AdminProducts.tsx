import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import { formatPrice } from '../lib/catalog';
import {
  ADMIN_SPEC_FILTER_LABELS,
  buildAdminProductFacets,
  categoryDisplayPath,
  countActiveAdminFilters,
  DEFAULT_ADMIN_PRODUCT_FILTERS,
  filterAdminProducts,
  sortAdminProducts,
  type AdminProductFilters,
  type AdminProductSort,
} from '../lib/adminProductList';
import { adjustProductPrices } from '../lib/priceAdjust';
import { useStore } from '../context/StoreContext';
import './admin.css';

const PAGE_SIZE = 80;

const SORT_OPTIONS: { value: AdminProductSort; label: string }[] = [
  { value: 'name-asc', label: 'Название А→Я' },
  { value: 'name-desc', label: 'Название Я→А' },
  { value: 'brand-asc', label: 'Бренд А→Я' },
  { value: 'price-asc', label: 'Цена ↑' },
  { value: 'price-desc', label: 'Цена ↓' },
  { value: 'category-asc', label: 'Категория' },
];

export function AdminProducts() {
  const {
    products,
    categories,
    deleteProduct,
    deleteProducts,
    getCategoryById,
    adjustAllPricesByPercent,
  } = useStore();

  const [filters, setFilters] = useState<AdminProductFilters>(DEFAULT_ADMIN_PRODUCT_FILTERS);
  const [sort, setSort] = useState<AdminProductSort>('name-asc');
  const [page, setPage] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const [percent, setPercent] = useState('10');
  const [adjustOldPrice, setAdjustOldPrice] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const facets = useMemo(
    () => buildAdminProductFacets(products, categories),
    [products, categories],
  );

  const filtered = useMemo(() => {
    const list = filterAdminProducts(products, filters, categories);
    return sortAdminProducts(list, sort, categories);
  }, [products, filters, sort, categories]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const pageItems = filtered.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  const activeFilterCount = countActiveAdminFilters(filters);
  const specValueOptions = useMemo(() => {
    if (!filters.specLabel) return [];
    return facets.specValues.find((s) => s.label === filters.specLabel)?.values ?? [];
  }, [facets.specValues, filters.specLabel]);

  useEffect(() => {
    setPage(0);
  }, [filters, sort]);

  useEffect(() => {
    setSelectedIds((prev) => {
      const visible = new Set(filtered.map((p) => p.id));
      const next = new Set<string>();
      for (const id of prev) {
        if (visible.has(id)) next.add(id);
      }
      return next;
    });
  }, [filtered]);

  const patchFilters = (patch: Partial<AdminProductFilters>) => {
    setFilters((f) => {
      const next = { ...f, ...patch };
      if (patch.specLabel != null && patch.specLabel !== f.specLabel) {
        next.specValue = '';
      }
      return next;
    });
    setMessage('');
    setError('');
  };

  const resetFilters = () => {
    setFilters(DEFAULT_ADMIN_PRODUCT_FILTERS);
    setSort('name-asc');
    setSelectedIds(new Set());
    setMessage('');
    setError('');
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const togglePageSelection = () => {
    const pageIds = pageItems.map((p) => p.id);
    const allSelected = pageIds.length > 0 && pageIds.every((id) => selectedIds.has(id));
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        for (const id of pageIds) next.delete(id);
      } else {
        for (const id of pageIds) next.add(id);
      }
      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds(new Set(filtered.map((p) => p.id)));
  };

  const deleteByIds = (ids: string[], label: string) => {
    if (!ids.length) return;
    if (
      !confirm(
        `Удалить ${ids.length} товаров (${label})? Действие необратимо в каталоге браузера.`,
      )
    ) {
      return;
    }
    const removed = deleteProducts(ids);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of ids) next.delete(id);
      return next;
    });
    setMessage(`Удалено товаров: ${removed}.`);
    setError('');
  };

  const deleteFiltered = () => deleteByIds(filtered.map((p) => p.id), 'по текущему фильтру');

  const deleteSelected = () => deleteByIds([...selectedIds], 'выбранные');

  const percentNum = parseFloat(percent.replace(',', '.'));
  const percentValid = Number.isFinite(percentNum) && percentNum !== 0;

  const pricePreview = useMemo(() => {
    if (!percentValid || filtered.length === 0) return null;
    const sample = filtered.find((p) => p.price > 0) ?? filtered[0]!;
    return { sample, updated: adjustProductPrices(sample, percentNum, adjustOldPrice) };
  }, [filtered, percentNum, percentValid, adjustOldPrice]);

  const handleAdjustPrices = () => {
    setError('');
    setMessage('');
    if (!percentValid) {
      setError('Укажите ненулевой процент (например 10 или -5).');
      return;
    }
    if (1 + percentNum / 100 <= 0) {
      setError('Слишком большое снижение — цены не могут стать отрицательными.');
      return;
    }
    const targetIds = filtered.map((p) => p.id);
    const scope =
      activeFilterCount > 0
        ? `${targetIds.length} отфильтрованных`
        : `всех ${targetIds.length}`;
    const label =
      percentNum > 0
        ? `увеличить на ${percentNum}%`
        : `уменьшить на ${Math.abs(percentNum)}%`;
    if (!confirm(`${label.charAt(0).toUpperCase() + label.slice(1)} цены у ${scope} товаров?`)) {
      return;
    }
    adjustAllPricesByPercent(
      percentNum,
      adjustOldPrice,
      activeFilterCount > 0 ? targetIds : undefined,
    );
    setMessage(
      `Цены ${percentNum > 0 ? 'увеличены' : 'уменьшены'} на ${Math.abs(percentNum)}% (${activeFilterCount > 0 ? targetIds.length : products.length} товаров).`,
    );
  };

  const pageAllSelected =
    pageItems.length > 0 && pageItems.every((p) => selectedIds.has(p.id));

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h1>Товары</h1>
          <p className="subtitle">
            {products.length} в каталоге
            {activeFilterCount > 0 && ` · показано ${filtered.length} по фильтру`}
          </p>
        </div>
        <Link to="/admin/products/new" className="admin-btn-primary">
          + Добавить товар
        </Link>
      </div>

      <div className="admin-card admin-form">
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>Фильтр и сортировка</h2>
        <div className="admin-form-grid">
          <label style={{ gridColumn: '1 / -1' }}>
            Поиск (название, бренд, артикул, 3/4, 1-1/2…)
            <input
              type="search"
              value={filters.query}
              onChange={(e) => patchFilters({ query: e.target.value })}
              placeholder="Насос, Valtec, 32х1…"
            />
          </label>
          <label>
            Бренд
            <select
              value={filters.brand}
              onChange={(e) => patchFilters({ brand: e.target.value })}
            >
              <option value="">Все бренды</option>
              {facets.brands.map((b) => (
                <option key={b.name} value={b.name}>
                  {b.name} ({b.count})
                </option>
              ))}
            </select>
          </label>
          <label>
            Категория
            <select
              value={filters.categoryId}
              onChange={(e) => patchFilters({ categoryId: e.target.value })}
            >
              <option value="">Все категории</option>
              {facets.categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label} ({c.count})
                </option>
              ))}
            </select>
          </label>
          <label>
            Характеристика
            <select
              value={filters.specLabel}
              onChange={(e) => patchFilters({ specLabel: e.target.value })}
            >
              <option value="">Любая</option>
              {ADMIN_SPEC_FILTER_LABELS.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Значение
            <select
              value={filters.specValue}
              disabled={!filters.specLabel}
              onChange={(e) => patchFilters({ specValue: e.target.value })}
            >
              <option value="">Любое</option>
              {specValueOptions.map((v) => (
                <option key={v.value} value={v.value}>
                  {v.value} ({v.count})
                </option>
              ))}
            </select>
          </label>
          <label>
            Наличие
            <select
              value={filters.inStock}
              onChange={(e) =>
                patchFilters({ inStock: e.target.value as AdminProductFilters['inStock'] })
              }
            >
              <option value="all">Все</option>
              <option value="yes">В наличии</option>
              <option value="no">Нет в наличии</option>
            </select>
          </label>
          <label>
            Скидка
            <select
              value={filters.onSale}
              onChange={(e) =>
                patchFilters({ onSale: e.target.value as AdminProductFilters['onSale'] })
              }
            >
              <option value="all">Все</option>
              <option value="yes">Со старой ценой</option>
              <option value="no">Без скидки</option>
            </select>
          </label>
          <label>
            Сортировка
            <select value={sort} onChange={(e) => setSort(e.target.value as AdminProductSort)}>
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="admin-toolbar" style={{ marginTop: '1rem', marginBottom: 0, flexWrap: 'wrap' }}>
          <button type="button" className="admin-btn-sm" onClick={resetFilters}>
            Сбросить фильтр
          </button>
          <button
            type="button"
            className="admin-btn-sm"
            disabled={!filtered.length}
            onClick={selectAllFiltered}
          >
            Выбрать все ({filtered.length})
          </button>
          <button
            type="button"
            className="admin-btn-sm danger"
            disabled={!selectedIds.size}
            onClick={deleteSelected}
          >
            Удалить выбранные ({selectedIds.size})
          </button>
          <button
            type="button"
            className="admin-btn-sm danger"
            disabled={!filtered.length}
            onClick={deleteFiltered}
          >
            Удалить по фильтру ({filtered.length})
          </button>
        </div>
        {filters.brand && (
          <p className="admin-hint" style={{ margin: '0.75rem 0 0' }}>
            Быстро:{' '}
            <button
              type="button"
              className="admin-link-btn danger"
              onClick={() =>
                deleteByIds(
                  products.filter((p) => p.brand === filters.brand).map((p) => p.id),
                  `бренд «${filters.brand}»`,
                )
              }
            >
              удалить все товары бренда «{filters.brand}»
            </button>
          </p>
        )}
        {filters.categoryId && (
          <p className="admin-hint" style={{ margin: '0.35rem 0 0' }}>
            Быстро:{' '}
            <button
              type="button"
              className="admin-link-btn danger"
              onClick={deleteFiltered}
            >
              удалить все в «{categoryDisplayPath(categories, filters.categoryId)}»
            </button>
          </p>
        )}
      </div>

      <div className="admin-card admin-form">
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>Массовое изменение цен</h2>
        <p className="admin-hint" style={{ margin: '0 0 1rem' }}>
          Применяется к отфильтрованным товарам, если фильтр активен, иначе — ко всему каталогу.
        </p>
        <div className="admin-form-grid">
          <label>
            Изменение, %
            <input
              type="number"
              step="0.1"
              value={percent}
              onChange={(e) => setPercent(e.target.value)}
              placeholder="10"
            />
          </label>
          <label className="admin-form-row" style={{ alignSelf: 'end' }}>
            <input
              type="checkbox"
              checked={adjustOldPrice}
              onChange={(e) => setAdjustOldPrice(e.target.checked)}
            />
            Также изменить перечёркнутую цену
          </label>
        </div>
        {pricePreview && (
          <p className="admin-hint" style={{ margin: '0.75rem 0 0' }}>
            Пример: «{pricePreview.sample.name}» — {formatPrice(pricePreview.sample.price)}
            {pricePreview.sample.oldPrice != null && (
              <> / <s>{formatPrice(pricePreview.sample.oldPrice)}</s></>
            )}
            {' → '}
            {formatPrice(pricePreview.updated.price)}
            {pricePreview.updated.oldPrice != null && (
              <> / <s>{formatPrice(pricePreview.updated.oldPrice)}</s></>
            )}
          </p>
        )}
        <div className="admin-toolbar" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <button
            type="button"
            className="admin-btn-primary"
            disabled={!products.length}
            onClick={handleAdjustPrices}
          >
            Применить
          </button>
        </div>
      </div>

      {error && <p className="admin-error">{error}</p>}
      {message && <p className="admin-success">{message}</p>}

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filtered.length > PAGE_SIZE && (
          <div
            className="admin-table-pagination"
            style={{
              padding: '0.65rem 1rem',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Стр. {safePage + 1} из {pageCount}
            </span>
            <button
              type="button"
              className="admin-btn-sm"
              disabled={safePage <= 0}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
            >
              ← Назад
            </button>
            <button
              type="button"
              className="admin-btn-sm"
              disabled={safePage >= pageCount - 1}
              onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
            >
              Вперёд →
            </button>
          </div>
        )}
        <table className="admin-table">
          <thead>
            <tr>
              <th className="check-cell">
                <input
                  type="checkbox"
                  checked={pageAllSelected}
                  onChange={togglePageSelection}
                  aria-label="Выбрать страницу"
                />
              </th>
              <th className="thumb-cell">Фото</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Наличие</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {pageItems.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>
                  Нет товаров по фильтру
                </td>
              </tr>
            ) : (
              pageItems.map((p) => (
                <tr key={p.id} className={selectedIds.has(p.id) ? 'admin-row-selected' : ''}>
                  <td className="check-cell">
                    <input
                      type="checkbox"
                      checked={selectedIds.has(p.id)}
                      onChange={() => toggleSelect(p.id)}
                      aria-label={`Выбрать ${p.name}`}
                    />
                  </td>
                  <td className="thumb-cell">
                    <ProductImage product={p} size="thumb" />
                  </td>
                  <td>
                    <strong>{p.name}</strong>
                    <br />
                    <small style={{ color: '#64748b' }}>{p.brand}</small>
                    {p.article && (
                      <>
                        <br />
                        <small style={{ color: '#94a3b8' }}>арт. {p.article}</small>
                      </>
                    )}
                  </td>
                  <td>{getCategoryById(p.categoryId)?.name ?? '—'}</td>
                  <td>
                    {formatPrice(p.price)}
                    {p.oldPrice != null && p.oldPrice > p.price && (
                      <>
                        <br />
                        <small style={{ color: '#94a3b8', textDecoration: 'line-through' }}>
                          {formatPrice(p.oldPrice)}
                        </small>
                      </>
                    )}
                  </td>
                  <td>{p.inStock ? '✓' : '—'}</td>
                  <td>
                    <div className="admin-actions">
                      <Link to={`/admin/products/${p.id}`} className="admin-btn-sm">
                        Изменить
                      </Link>
                      <button
                        type="button"
                        className="admin-btn-sm danger"
                        onClick={() => {
                          if (confirm(`Удалить «${p.name}»?`)) deleteProduct(p.id);
                        }}
                      >
                        Удалить
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
