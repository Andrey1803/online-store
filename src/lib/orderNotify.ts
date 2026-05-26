import type { OrderRequest } from '../data/orders';

export type OrderNotifyResult =
  | { ok: true }
  | { ok: false; error: string; skipped?: boolean };

/** Человекочитаемый номер заявки для клиента */
export function formatOrderNumber(order: OrderRequest): string {
  const d = new Date(order.createdAt);
  const ymd =
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const tail = order.id.replace(/\D/g, '').slice(-6) || '000000';
  return `АС-${ymd}-${tail}`;
}

export async function notifyOrderByEmail(order: OrderRequest): Promise<OrderNotifyResult> {
  if (import.meta.env.DEV) {
    console.info('[order] dev mode — email not sent', order);
    return { ok: true };
  }

  try {
    const res = await fetch('/api/order.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: formatOrderNumber(order),
        customerName: order.customerName,
        phone: order.phone,
        comment: order.comment,
        deliveryMethod: order.deliveryMethod,
        total: order.total,
        items: order.items,
        customerEmail: order.customerEmail,
        website: '',
      }),
    });

    const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };

    if (!res.ok || !data.ok) {
      return { ok: false, error: data.error || `Ошибка сервера (${res.status})` };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Нет связи с сервером. Позвоните нам или повторите позже.' };
  }
}
