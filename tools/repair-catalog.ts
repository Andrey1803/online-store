/**
 * Пересобрать категории в public/catalog/store.json без повторного парсинга Excel.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defaultCategories } from '../src/data/categories';
import { repairProductCategories } from '../src/lib/categoryAssign';

const storePath = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'catalog', 'store.json');

const raw = JSON.parse(await readFile(storePath, 'utf8'));
const { products, categories } = repairProductCategories(
  raw.products,
  raw.categories ?? defaultCategories,
);

const bundle = {
  ...raw,
  version: raw.version ?? 1,
  exportedAt: new Date().toISOString(),
  products,
  categories,
};

await writeFile(storePath, JSON.stringify(bundle), 'utf8');
console.log(`OK: ${products.length} products, ${categories.length} categories`);
