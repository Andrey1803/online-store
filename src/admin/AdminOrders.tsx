import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ORDER_STATUS_LABELS, type OrderRequest, type OrderStatus } from '../data/orders';
import { useOrders } from '../context/OrdersContext';
import { formatPrice } from '../lib/catalog';
import { formatOrderDate } from '../lib/formatDate';
import './admin.css';

type StatusFilter = 'all' | OrderStatus;

export function AdminOrders() {
  const { orders, updateOrderStatus, deleteOrder } = useOrders();
  const [filter, setFilter] = useState<StatusFilter>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const list = filter === 'all' ? orders : orders.filter((o) => o.status === filter);
    return [...list].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }, [orders, filter]);

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = {
      all: orders.length,
      new: 0,
      in_progress: 0,
      done: 0,
      cancelled: 0,
    };
    for (const o of orders) c[o.status]++;
    return c;
  }, [orders]);

  return (
    <div className="admin-page">
      <h1>Заявки</h1>
      <p className="subtitle">
        Заявки из корзины сохраняются в этом браузере. Для приёма заказов с сайта посетителей
        позже понадобится сервер или почта.
      </p>

      <div className="admin-order-filters">
        {(
          [
            ['all', 'Все'],
            ['new', ORDER_STATUS_LABELS.new],
            ['in_progress', ORDER_STATUS_LABELS.in_progress],
            ['done', ORDER_STATUS_LABELS.done],
            ['cancelled', ORDER_STATUS_LABELS.cancelled],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            className={`admin-order-filter${filter === key ? ' active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
            <span className="admin-order-filter-count">{counts[key]}</span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="admin-card">
          <p style={{ color: '#64748b', margin: 0 }}>
            {orders.length === 0
              ? 'Заявок пока нет. Оформите тестовый заказ в корзине на сайте.'
              : 'Нет заявок с выбранным статусом.'}
          </p>
        </div>
      ) : (
        <div className="admin-orders-list">
          {filtered.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              expanded={expandedId === order.id}
              onToggle={() => setExpandedId((id) => (id === order.id ? null : order.id))}
              onStatusChange={(status) => updateOrderStatus(order.id, status)}
              onDelete={() => {
                if (confirm('Удалить заявку?')) deleteOrder(order.id);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OrderCard({
  order,
  expanded,
  onToggle,
  onStatusChange,
  onDelete,
}: {
  order: OrderRequest;
  expanded: boolean;
  onToggle: () => void;
  onStatusChange: (status: OrderStatus) => void;
  onDelete: () => void;
}) {
  const itemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

  return (
    <article className={`admin-order-card${order.status === 'new' ? ' admin-order-card--new' : ''}`}>
      <button type="button" className="admin-order-card-head" onClick={onToggle}>
        <div className="admin-order-card-main">
          <strong>{order.customerName}</strong>
          <a href={`tel:${order.phone.replace(/\s/g, '')}`} onClick={(e) => e.stopPropagation()}>
            {order.phone}
          </a>
          <span className="admin-order-meta">
            {formatOrderDate(order.createdAt)} · {itemsCount} шт. · {formatPrice(order.total)}
            {order.customerEmail ? ` · ${order.customerEmail}` : ''}
          </span>
        </div>
        <span className={`admin-order-status admin-order-status--${order.status}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </button>

      {expanded && (
        <div className="admin-order-card-body">
          {order.comment && (
            <p className="admin-order-comment">
              <strong>Комментарий:</strong> {order.comment}
            </p>
          )}

          <table className="admin-table">
            <thead>
              <tr>
                <th>Товар</th>
                <th>Артикул</th>
                <th>Цена</th>
                <th>Кол-во</th>
                <th>Сумма</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={`${item.productId}-${item.slug}`}>
                  <td>
                    <Link to={`/product/${item.slug}`} target="_blank" rel="noreferrer">
                      {item.name}
                    </Link>
                  </td>
                  <td>{item.article ?? '—'}</td>
                  <td>{formatPrice(item.price)}</td>
                  <td>{item.quantity}</td>
                  <td>{formatPrice(item.price * item.quantity)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="admin-order-actions">
            <label>
              Статус
              <select
                value={order.status}
                onChange={(e) => onStatusChange(e.target.value as OrderStatus)}
              >
                {(Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {ORDER_STATUS_LABELS[s]}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" className="admin-btn-sm danger" onClick={onDelete}>
              Удалить
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
