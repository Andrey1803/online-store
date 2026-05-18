import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import { formatPrice } from '../lib/catalog';
import { adjustProductPrices } from '../lib/priceAdjust';
import { useStore } from '../context/StoreContext';
import './admin.css';

export function AdminProducts() {
  const { products, deleteProduct, getCategoryById, adjustAllPricesByPercent } = useStore();
  const [percent, setPercent] = useState('10');
  const [adjustOldPrice, setAdjustOldPrice] = useState(true);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const percentNum = parseFloat(percent.replace(',', '.'));
  const percentValid = Number.isFinite(percentNum) && percentNum !== 0;

  const preview = useMemo(() => {
    if (!percentValid || products.length === 0) return null;
    const sample = products.find((p) => p.price > 0) ?? products[0]!;
    const updated = adjustProductPrices(sample, percentNum, adjustOldPrice);
    return { sample, updated };
  }, [products, percentNum, percentValid, adjustOldPrice]);

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

    const label =
      percentNum > 0
        ? `увеличить на ${percentNum}%`
        : `уменьшить на ${Math.abs(percentNum)}%`;

    if (
      !confirm(
        `${label.charAt(0).toUpperCase() + label.slice(1)} цены у всех ${products.length} товаров? Изменения сохранятся в браузере.`,
      )
    ) {
      return;
    }

    adjustAllPricesByPercent(percentNum, adjustOldPrice);
    setMessage(
      `Готово: цены ${percentNum > 0 ? 'увеличены' : 'уменьшены'} на ${Math.abs(percentNum)}% (${products.length} товаров).`,
    );
  };

  return (
    <div className="admin-page">
      <div className="admin-toolbar">
        <div>
          <h1>Товары</h1>
          <p className="subtitle">{products.length} позиций в каталоге</p>
        </div>
        <Link to="/admin/products/new" className="admin-btn-primary">
          + Добавить товар
        </Link>
      </div>

      <div className="admin-card admin-form">
        <h2 style={{ margin: '0 0 0.75rem', fontSize: '1.05rem' }}>Массовое изменение цен</h2>
        <p className="admin-hint" style={{ margin: '0 0 1rem' }}>
          Процент применяется ко всем товарам каталога. Положительное значение — повышение, отрицательное —
          снижение. Для публикации на сайте экспортируйте каталог в «Настройках сайта».
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
        {preview && (
          <p className="admin-hint" style={{ margin: '0.75rem 0 0' }}>
            Пример: «{preview.sample.name}» — {formatPrice(preview.sample.price)}
            {preview.sample.oldPrice != null && (
              <> / <s>{formatPrice(preview.sample.oldPrice)}</s></>
            )}
            {' → '}
            {formatPrice(preview.updated.price)}
            {preview.updated.oldPrice != null && (
              <> / <s>{formatPrice(preview.updated.oldPrice)}</s></>
            )}
          </p>
        )}
        {error && <p className="admin-error" style={{ marginTop: '0.75rem' }}>{error}</p>}
        {message && <p className="admin-success" style={{ marginTop: '0.75rem' }}>{message}</p>}
        <div className="admin-toolbar" style={{ marginTop: '1rem', marginBottom: 0 }}>
          <button
            type="button"
            className="admin-btn-primary"
            disabled={!products.length}
            onClick={handleAdjustPrices}
          >
            Применить ко всем товарам
          </button>
          <button
            type="button"
            className="admin-btn-sm"
            onClick={() => {
              setPercent('10');
              setAdjustOldPrice(true);
              setError('');
              setMessage('');
            }}
          >
            Сбросить
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="admin-table">
          <thead>
            <tr>
              <th className="thumb-cell">Фото</th>
              <th>Название</th>
              <th>Категория</th>
              <th>Цена</th>
              <th>Наличие</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id}>
                <td className="thumb-cell">
                  <ProductImage product={p} size="thumb" />
                </td>
                <td>
                  <strong>{p.name}</strong>
                  <br />
                  <small style={{ color: '#64748b' }}>{p.brand}</small>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
