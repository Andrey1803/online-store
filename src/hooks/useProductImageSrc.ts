import { useEffect, useState } from 'react';
import type { Product } from '../data/products';
import {
  articleFromIdbRef,
  getProductImage,
  isIdbImageRef,
} from '../lib/productImageStore';
import { isServerCatalogImage } from '../lib/serverCatalog';

function tryServerCatalogImage(
  article: string,
  onFound: (url: string) => void,
  isCancelled: () => boolean,
): void {
  const base = `/catalog/images/${encodeURIComponent(article)}`;
  const exts = ['jpg', 'png', 'webp', 'jpeg'];
  let i = 0;
  const next = () => {
    if (isCancelled() || i >= exts.length) return;
    const url = `${base}.${exts[i++]}`;
    const probe = new Image();
    probe.onload = () => {
      if (!isCancelled()) onFound(url);
    };
    probe.onerror = next;
    probe.src = url;
  };
  next();
}

export function useProductImageSrc(product: Product): string | undefined {
  const [src, setSrc] = useState<string | undefined>(() => {
    if (!product.image || isIdbImageRef(product.image)) return undefined;
    return product.image;
  });

  useEffect(() => {
    if (!product.image) {
      setSrc(undefined);
      return;
    }
    if (isServerCatalogImage(product.image) || product.image.startsWith('http')) {
      setSrc(product.image);
      return;
    }
    if (!isIdbImageRef(product.image)) {
      setSrc(product.image);
      return;
    }
    const article = product.article ?? articleFromIdbRef(product.image);
    let cancelled = false;
    getProductImage(article).then((url) => {
      if (cancelled) return;
      if (url) {
        setSrc(url);
        return;
      }
      tryServerCatalogImage(article, setSrc, () => cancelled);
    });
    return () => {
      cancelled = true;
    };
  }, [product.image, product.article]);

  return src;
}
