import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { OrderRequest, OrderStatus, SubmitOrderInput } from '../data/orders';

const STORAGE_KEY = 'akvasnab-orders';

function loadOrders(): OrderRequest[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as OrderRequest[];
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    /* ignore */
  }
  return [];
}

function createOrderId(): string {
  return `ord-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

interface OrdersContextValue {
  orders: OrderRequest[];
  newOrdersCount: number;
  submitOrder: (input: SubmitOrderInput) => OrderRequest;
  getOrdersForCustomer: (customerId: string) => OrderRequest[];
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;
}

const OrdersContext = createContext<OrdersContextValue | null>(null);

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<OrderRequest[]>(loadOrders);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  }, [orders]);

  const submitOrder = useCallback((input: SubmitOrderInput): OrderRequest => {
    const order: OrderRequest = {
      id: createOrderId(),
      createdAt: new Date().toISOString(),
      status: 'new',
      customerName: input.customerName.trim(),
      phone: input.phone.trim(),
      comment: input.comment?.trim() || undefined,
      items: input.items,
      total: input.total,
      customerId: input.customerId,
      customerEmail: input.customerEmail,
    };
    setOrders((prev) => [order, ...prev]);
    return order;
  }, []);

  const updateOrderStatus = useCallback((id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
  }, []);

  const deleteOrder = useCallback((id: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== id));
  }, []);

  const getOrdersForCustomer = useCallback(
    (customerId: string) =>
      orders
        .filter((o) => o.customerId === customerId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders],
  );

  const newOrdersCount = useMemo(
    () => orders.filter((o) => o.status === 'new').length,
    [orders],
  );

  const value = useMemo(
    () => ({
      orders,
      newOrdersCount,
      submitOrder,
      getOrdersForCustomer,
      updateOrderStatus,
      deleteOrder,
    }),
    [orders, newOrdersCount, submitOrder, getOrdersForCustomer, updateOrderStatus, deleteOrder],
  );

  return <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>;
}

export function useOrders() {
  const ctx = useContext(OrdersContext);
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider');
  return ctx;
}
