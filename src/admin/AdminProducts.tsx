import { Link } from 'react-router-dom';
import { ProductImage } from '../components/ProductImage';
import { formatPrice } from '../lib/catalog';
import { useStore } from '../context/StoreContext';
import './admin.css';

export function AdminProducts() {
  const { products, deleteProduct, getCategoryById } = useStore();

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
                <td>{formatPrice(p.price)}</td>
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
