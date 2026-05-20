import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { ORDER_STATUS_LABELS } from '../data/orders';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useOrders } from '../context/OrdersContext';
import { formatPrice } from '../lib/catalog';
import { formatOrderDate } from '../lib/formatDate';
import './Account.css';

export function Account() {
  const { user, isAuthenticated, logout, updateProfile } = useCustomerAuth();
  const { getOrdersForCustomer } = useOrders();
  const [profile, setProfile] = useState({ name: '', phone: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSuccess, setProfileSuccess] = useState('');

  useEffect(() => {
    if (user) {
      setProfile({ name: user.name, phone: user.phone });
    }
  }, [user]);

  if (!isAuthenticated || !user) {
    return <Navigate to="/account/login" replace />;
  }

  const myOrders = getOrdersForCustomer(user.id);

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');
    const result = updateProfile(profile);
    if (result.ok) {
      setProfileSuccess('Данные сохранены');
    } else {
      setProfileError(result.error);
    }
  };

  return (
    <div className="account-page account-page--wide">
      <div className="account-card">
        <div className="account-profile-head">
          <div>
            <h1>Здравствуйте, {user.name}</h1>
            <p className="account-profile-email">{user.email}</p>
          </div>
          <button type="button" className="btn btn-outline" onClick={logout}>
            Выйти
          </button>
        </div>

        <form className="account-form" onSubmit={handleProfileSave}>
          <label>
            Имя
            <input
              required
              value={profile.name}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
            />
          </label>
          <label>
            Телефон
            <input
              type="tel"
              required
              value={profile.phone}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
            />
          </label>
          {profileError && <p className="account-error">{profileError}</p>}
          {profileSuccess && <p className="account-success">{profileSuccess}</p>}
          <button type="submit" className="btn btn-primary">
            Сохранить
          </button>
        </form>

        <section className="account-orders">
          <h2>Мои заявки</h2>
          {myOrders.length === 0 ? (
            <p style={{ color: '#64748b' }}>
              Заявок пока нет.{' '}
              <Link to="/catalog">Перейти в каталог</Link>
            </p>
          ) : (
            myOrders.map((order) => (
              <article key={order.id} className="account-order-item">
                <div className="account-order-item-head">
                  <div>
                    <strong>{formatOrderDate(order.createdAt)}</strong>
                    <span> · {formatPrice(order.total, true)}</span>
                  </div>
                  <span className={`account-order-status account-order-status--${order.status}`}>
                    {ORDER_STATUS_LABELS[order.status]}
                  </span>
                </div>
                <ul className="account-order-lines">
                  {order.items.map((item) => (
                    <li key={`${item.productId}-${item.slug}`}>
                      {item.name} × {item.quantity} —{' '}
                      {formatPrice(item.price * item.quantity, true)}
                    </li>
                  ))}
                </ul>
              </article>
            ))
          )}
        </section>
      </div>
    </div>
  );
}
