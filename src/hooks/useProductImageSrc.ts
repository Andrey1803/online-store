import { useEffect, useState } from 'react';
import type { Product } from '../data/products';
import { articleFromIdbRef, getProductImage, isIdbImageRef } from '../lib/productImageStore';

export function useProductImageSrc(product: Product): string | undefined {
  const [src, setSrc] = useState<string | undefined>(
    product.image && !isIdbImageRef(product.image) ? product.image : undefined,
  );

  useEffect(() => {
    if (!product.image) {
      setSrc(undefined);
      return;
    }
    if (!isIdbImageRef(product.image)) {
      setSrc(product.image);
      return;
    }
    const article = product.article ?? articleFromIdbRef(product.image);
    let cancelled = false;
    getProductImage(article).then((url) => {
      if (!cancelled) setSrc(url);
    });
    return () => {
      cancelled = true;
    };
  }, [product.image, product.article]);

  return src;
}
