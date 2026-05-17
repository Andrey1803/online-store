import { get, set, del, keys } from 'idb-keyval';
const PREFIX = 'img:';

export const IDB_IMAGE_PREFIX = 'idb:';

export function isIdbImageRef(src?: string): boolean {
  return Boolean(src?.startsWith(IDB_IMAGE_PREFIX));
}

export function toIdbImageRef(article: string): string {
  return `${IDB_IMAGE_PREFIX}${article}`;
}

export function articleFromIdbRef(src: string): string {
  return src.slice(IDB_IMAGE_PREFIX.length);
}

export async function getProductImage(article: string): Promise<string | undefined> {
  return get<string>(PREFIX + article);
}

export async function saveProductImage(article: string, dataUrl: string): Promise<void> {
  await set(PREFIX + article, dataUrl);
}

export async function saveProductImagesBatch(
  entries: { article: string; dataUrl: string }[],
  onProgress?: (done: number, total: number) => void,
): Promise<void> {
  const chunk = 50;
  for (let i = 0; i < entries.length; i += chunk) {
    const slice = entries.slice(i, i + chunk);
    await Promise.all(slice.map((e) => set(PREFIX + e.article, e.dataUrl)));
    onProgress?.(Math.min(i + chunk, entries.length), entries.length);
  }
}

export async function clearAllProductImages(): Promise<number> {
  const all = await keys();
  const imageKeys = all.filter((k) => String(k).startsWith(PREFIX));
  await Promise.all(imageKeys.map((k) => del(k)));
  return imageKeys.length;
}

