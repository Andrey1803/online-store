import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { STATIC_PAGE_SEO } from '../data/seo';
import type { DeliveryMethod } from '../data/orders';
import { formatPrice } from '../lib/catalog';
import { isValidPhone } from '../lib/customerNormalize';
import { formatOrderNumber } from '../lib/orderNotify';
import { useCart } from '../context/CartContext';
import { useCustomerAuth } from '../context/CustomerAuthContext';
import { useOrders } from '../context/OrdersContext';
import { useStore } from '../context/StoreContext';
import { ProductImage } from '../components/ProductImage';
import { ConsentField } from '../components/ConsentField';
import './Account.css';
import './Cart.css';

export function Cart() {
  const { site } = useStore();
  const { items, updateQuantity, removeItem, clearCart, totalPrice } = useCart();
  const { user } = useCustomerAuth();
  const { submitOrder } = useOrders();
  const [sent, setSent] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [consent, setConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [form, setForm] = useState({
    name: '',
    phone: '',
    comment: '',
    deliveryMethod: 'delivery' as DeliveryMethod,
  });

  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name,
        phone: user.phone,
      }));
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent || submitting) return;

    if (!isValidPhone(form.phone)) {
      setPhoneError('Укажите корректный номер (+375 …)');
      return;
    }
    setPhoneError('');
    setSubmitError('');
    setSubmitting(true);

    try {
      const { order, notify } = await submitOrder({
        customerName: form.name,
        phone: form.phone,
        comment: form.comment || undefined,
        deliveryMethod: form.deliveryMethod,
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

      if (!notify.ok) {
        setSubmitError(notify.error);
        return;
      }

      setOrderNumber(formatOrderNumber(order));
      setSent(true);
      clearCart();
    } finally {
      setSubmitting(false);
    }
  };

  const cartSeo = (
    <PageMeta
      title={STATIC_PAGE_SEO.cart.title}
      description={STATIC_PAGE_SEO.cart.description}
      path={STATIC_PAGE_SEO.cart.path}
      noindex
    />
  );

  if (items.length === 0 && !sent) {
    return (
      <>
        {cartSeo}
        <div className="empty-state cart-empty">
          <h1>Корзина пуста</h1>
          <p>Добавьте товары из каталога</p>
          <Link to="/catalog" className="btn btn-primary">
            Перейти в каталог
          </Link>
        </div>
      </>
    );
  }

  if (sent) {
    return (
      <>
        {cartSeo}
        <div className="empty-state order-success">
          <h1>Заявка отправлена</h1>
          {orderNumber && (
            <p className="order-success__number">
              Номер заявки: <strong>{orderNumber}</strong>
            </p>
          )}
          <p>
            Мы свяжемся с вами по телефону {form.phone || site.phone} для подтверждения заказа. Копия
            отправлена на <a href={`mailto:${site.email}`}>{site.email}</a>.
          </p>
          <Link to="/catalog" className="btn btn-primary">
            Продолжить покупки
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      {cartSeo}
      <div className="cart-page">
        <h1>Корзина</h1>
        <div className="cart-layout">
          <div className="cart-items">
            {items.map(({ product, quantity }) => (
              <div key={product.id} className="cart-item">
                <ProductImage product={product} size="thumb" />
                <div className="cart-item-info">
                  <Link to={`/product/${product.slug}`}>{product.name}</Link>
                  <span className="cart-item-price">{formatPrice(product.price, true)}</span>
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
                <strong>{formatPrice(product.price * quantity, true)}</strong>
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
              Итого: <strong>{formatPrice(totalPrice, true)}</strong>
            </p>
            <p className="cart-note">{site.markupNote}</p>
            {!user && (
              <p className="account-guest-hint">
                <Link to="/account/login">Войдите</Link> или{' '}
                <Link to="/account/login?tab=register">зарегистрируйтесь</Link>, чтобы сохранить заявки
                в личном кабинете.
              </p>
            )}
            <form onSubmit={handleSubmit} className="order-form">
              <fieldset className="order-form__delivery">
                <legend>Способ получения</legend>
                <label>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="delivery"
                    checked={form.deliveryMethod === 'delivery'}
                    onChange={() => setForm({ ...form, deliveryMethod: 'delivery' })}
                  />
                  Доставка (уточним при звонке)
                </label>
                <label>
                  <input
                    type="radio"
                    name="deliveryMethod"
                    value="pickup"
                    checked={form.deliveryMethod === 'pickup'}
                    onChange={() => setForm({ ...form, deliveryMethod: 'pickup' })}
                  />
                  Самовывоз
                </label>
              </fieldset>
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
                  placeholder="+375 (29) 123-45-67"
                  value={form.phone}
                  onChange={(e) => {
                    setForm({ ...form, phone: e.target.value });
                    setPhoneError('');
                  }}
                  aria-invalid={!!phoneError}
                />
                {phoneError && <span className="form-error">{phoneError}</span>}
              </label>
              <label>
                Комментарий
                <textarea
                  rows={3}
                  value={form.comment}
                  onChange={(e) => setForm({ ...form, comment: e.target.value })}
                />
              </label>
              <ConsentField
                id="order-consent"
                variant="order"
                checked={consent}
                onChange={setConsent}
              />
              {submitError && <p className="form-error form-error--block">{submitError}</p>}
              <button
                type="submit"
                className="btn btn-primary btn-lg"
                disabled={!consent || submitting}
              >
                {submitting ? 'Отправка…' : 'Отправить заявку'}
              </button>
            </form>
          </aside>
        </div>
      </div>
    </>
  );
}
