import type { Category } from '../data/categories';
import type { Product } from '../data/products';

export const SERVER_CATALOG_URL = '/catalog/store.json';

export interface ServerCatalogBundle {
  version: number;
  exportedAt?: string;
  products: Product[];
  categories?: Category[];
}

export function isServerCatalogImage(src?: string): boolean {
  return Boolean(src?.startsWith('/catalog/images/'));
}

/** Путь к фото на сервере (после export-catalog) */
export function serverCatalogImagePath(article: string, ext: string): string {
  return `/catalog/images/${encodeURIComponent(article)}.${ext}`;
}

export async function fetchServerCatalog(): Promise<ServerCatalogBundle | null> {
  try {
    const res = await fetch(SERVER_CATALOG_URL, { cache: 'no-store' });
    if (!res.ok) return null;
    const data = (await res.json()) as ServerCatalogBundle;
    if (!data?.products?.length) return null;
    return data;
  } catch {
    return null;
  }
}
