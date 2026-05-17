import { Link, NavLink, Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useOrders } from '../context/OrdersContext';
import { useStore } from '../context/StoreContext';
import { BackButton, getAdminBackFallback } from '../components/BackButton';
import './admin.css';

export function AdminLayout() {
  const { isAuthenticated, logout } = useAdminAuth();
  const { site } = useStore();
  const { newOrdersCount } = useOrders();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
  }

  const nav: { to: string; label: string; end?: boolean; badge?: number }[] = [
    { to: '/admin', label: 'Обзор', end: true },
    { to: '/admin/products', label: 'Товары' },
    { to: '/admin/orders', label: 'Заявки', badge: newOrdersCount },
    { to: '/admin/customers', label: 'Клиенты' },
    { to: '/admin/import', label: 'Импорт Excel' },
    { to: '/admin/categories', label: 'Категории' },
    { to: '/admin/settings', label: 'Настройки сайта' },
  ];

  return (
    <div className="admin-app">
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <strong>Админка</strong>
          <small>{site.name}</small>
        </div>
        <nav className="admin-nav">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => (isActive ? 'active' : undefined)}
            >
              {item.label}
              {(item.badge ?? 0) > 0 ? (
                <span className="admin-nav-badge">{item.badge}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <Link to="/" target="_blank" rel="noreferrer">
            Открыть магазин ↗
          </Link>
          <button type="button" className="admin-logout" onClick={logout}>
            Выйти
          </button>
        </div>
      </aside>
      <main className="admin-main">
        {location.pathname !== '/admin' && (
          <div className="admin-toolbar admin-toolbar--sticky">
            <BackButton fallback={getAdminBackFallback(location.pathname)} />
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
