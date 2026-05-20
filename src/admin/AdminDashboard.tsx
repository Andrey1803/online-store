import { Link } from 'react-router-dom';
import { useOrders } from '../context/OrdersContext';
import { listCustomerProfiles } from '../lib/customerStore';
import { useStore } from '../context/StoreContext';
import './admin.css';

export function AdminDashboard() {
  const { products, categories, resetToDefaults } = useStore();
  const { orders, newOrdersCount } = useOrders();
  const customersCount = listCustomerProfiles().length;

  return (
    <div className="admin-page">
      <h1>Панель управления</h1>
      <p className="subtitle">Редактирование каталога и настроек магазина</p>

      <div className="stats-grid">
        <div className="stat-card">
          <strong>{products.length}</strong>
          <span>товаров</span>
        </div>
        <div className="stat-card">
          <strong>{categories.length}</strong>
          <span>категорий</span>
        </div>
        <div className="stat-card">
          <strong>{products.filter((p) => p.featured).length}</strong>
          <span>на главной</span>
        </div>
        <div className="stat-card">
          <strong>{products.filter((p) => p.image).length}</strong>
          <span>с фото</span>
        </div>
        <Link to="/admin/orders" className="stat-card stat-card--link">
          <strong>{orders.length}</strong>
          <span>
            заявок{newOrdersCount > 0 ? ` (${newOrdersCount} новых)` : ''}
          </span>
        </Link>
        <Link to="/admin/customers" className="stat-card stat-card--link">
          <strong>{customersCount}</strong>
          <span>клиентов</span>
        </Link>
      </div>

      <div className="admin-card">
        <h2>Быстрые действия</h2>
        <div className="admin-toolbar" style={{ marginBottom: 0 }}>
          <Link to="/admin/import" className="admin-btn-primary">
            Импорт из Excel
          </Link>
          <Link to="/admin/products/new" className="admin-btn-sm">
            + Один товар
          </Link>
          <Link to="/admin/categories" className="admin-btn-sm">
            Категории
          </Link>
          <Link to="/admin/orders" className="admin-btn-sm">
            Заявки{newOrdersCount > 0 ? ` (${newOrdersCount})` : ''}
          </Link>
          <Link to="/admin/customers" className="admin-btn-sm">
            Клиенты
          </Link>
          <Link to="/admin/settings" className="admin-btn-sm">
            Настройки сайта
          </Link>
        </div>
      </div>

      <div className="admin-card">
        <h2>Данные</h2>
        <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1rem' }}>
          Все изменения сохраняются в браузере (localStorage). Для резервной копии экспортируйте
          данные из настроек.
        </p>
        <button
          type="button"
          className="admin-btn-sm danger"
          onClick={() => {
            if (confirm('Сбросить все товары, категории и настройки к исходным?')) {
              resetToDefaults();
            }
          }}
        >
          Сбросить к демо-данным
        </button>
      </div>
    </div>
  );
}
