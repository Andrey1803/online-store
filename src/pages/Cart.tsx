import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { formatPrice } from '../lib/catalog';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useOrders } from '../context/OrdersContext';
import { useStore } from '../context/StoreContext';
import { ProductImage } from '../components/ProductImage';
import './Account.css';
import './Cart.css';

export function Cart() {
  const { site } = useStore();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { user } = useCustomerAuth();
  const { submitOrder } = useOrders();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', comment: '' });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name,
        phone: user.phone,
      }));
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitOrder({
      customerName: form.name,
      phone: form.phone,
      comment: form.comment || undefined,
      customerId: user?.id,
      customerEmail: user?.email,
      items: items.map(({ product, quantity }) => ({
        productId: product.id,
        article: product.article,
        name: product.name,
        slug: product.slug,
        price: product.price,
        quantity,
      })),
      total: totalPrice,
    });
    setSent(true);
    clearCart();
  };

  if (items.length === 0 && !sent) {
    return (
      <div className="empty-state cart-empty">
        <h1>Корзина пуста</h1>
        <p>Добавьте товары из каталога</p>
        <Link to="/catalog" className="btn btn-primary">
          Перейти в каталог
        </Link>
      </div>
    );
  }

  if (sent) {
    return (
      <div className="empty-state order-success">
        <h1>Заявка отправлена</h1>
        <p>
          Мы свяжемся с вами по телефону {form.phone || site.phone} для подтверждения заказа.
        </p>
        <Link to="/catalog" className="btn btn-primary">
          Продолжить покупки
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <h1>Корзина</h1>
      <div className="cart-layout">
        <div className="cart-items">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="cart-item">
              <ProductImage product={product} size="thumb" />
              <div className="cart-item-info">
                <Link to={`/product/${product.slug}`}>{product.name}</Link>
                <span className="cart-item-price">{formatPrice(product.price)}</span>
              </div>
              <div className="cart-item-qty">
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity - 1)}
                  aria-label="Уменьшить"
                >
                  −
                </button>
                <span>{quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(product.id, quantity + 1)}
                  aria-label="Увеличить"
                >
                  +
                </button>
              </div>
              <strong>{formatPrice(product.price * quantity)}</strong>
              <button
                type="button"
                className="cart-remove"
                onClick={() => removeItem(product.id)}
                aria-label="Удалить"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <aside className="cart-summary">
          <h2>Оформление</h2>
          <p className="cart-total">
            Итого: <strong>{formatPrice(totalPrice)}</strong>
          </p>
          <p className="cart-note">{site.markupNote}</p>
          {!user && (
            <p className="account-guest-hint">
              <Link to="/account/login">Войдите</Link> или{' '}
              <Link to="/account/login?tab=register">зарегистрируйтесь</Link>, чтобы сохранить заявки в
              личном
              кабинете.
            </p>
          )}
          <form onSubmit={handleSubmit} className="order-form">
            <label>
              Имя
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>
            <label>
              Телефон
              <input
                required
                type="tel"
                placeholder="+375 29 ..."
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </label>
            <label>
              Комментарий
              <textarea
                rows={3}
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
              />
            </label>
            <button type="submit" className="btn btn-primary btn-lg">
              Отправить заявку
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
}
