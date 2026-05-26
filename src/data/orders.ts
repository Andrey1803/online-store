export type OrderStatus = 'new' | 'in_progress' | 'done' | 'cancelled';

export interface OrderLineItem {
  productId: string;
  article?: string;
  name: string;
  slug: string;
  price: number;
  quantity: number;
}

export type DeliveryMethod = 'delivery' | 'pickup';

export interface OrderRequest {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customerName: string;
  phone: string;
  comment?: string;
  deliveryMethod?: DeliveryMethod;
  items: OrderLineItem[];
  total: number;
  /** Зарегистрированный клиент */
  customerId?: string;
  customerEmail?: string;
}

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  new: 'Новая',
  in_progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
};

export type SubmitOrderInput = {
  customerName: string;
  phone: string;
  comment?: string;
  deliveryMethod?: DeliveryMethod;
  items: OrderLineItem[];
  total: number;
  customerId?: string;
  customerEmail?: string;
};
