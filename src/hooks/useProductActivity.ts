import { useEffect, useMemo, useState } from 'react';
import type { Product } from '../data/products';
import {
  getRecentlyViewedProducts,
  getTopCartProducts,
  hasCartAddStats,
  PRODUCT_ACTIVITY_EVENT,
  TOP_CART_PRODUCTS_LIMIT,
  RECENTLY_VIEWED_LIMIT,
} from '../lib/productActivity';

export function useProductActivity(
  products: Product[],
  options: { viewedLimit?: number; topCartLimit?: number } = {},
) {
  const viewedLimit = options.viewedLimit ?? RECENTLY_VIEWED_LIMIT;
  const topCartLimit = options.topCartLimit ?? TOP_CART_PRODUCTS_LIMIT;
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener(PRODUCT_ACTIVITY_EVENT, onChange);
    return () => window.removeEventListener(PRODUCT_ACTIVITY_EVENT, onChange);
  }, []);

  const recentlyViewed = useMemo(() => {
    void tick;
    return getRecentlyViewedProducts(products, viewedLimit);
  }, [products, viewedLimit, tick]);

  const topCart = useMemo(() => {
    void tick;
    return getTopCartProducts(products, topCartLimit);
  }, [products, topCartLimit, tick]);

  const hasTopCart = useMemo(() => {
    void tick;
    return hasCartAddStats();
  }, [tick]);

  return { recentlyViewed, topCart, hasTopCart };
}
