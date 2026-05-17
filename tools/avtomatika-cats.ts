import { readFile } from 'node:fs/promises';
import { collectCategoryTreeIds } from '../src/lib/catalog';

const data = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const products = data.products as { categoryId: string }[];
const categories = data.categories as { id: string; name: string; parentId?: string }[];

const avt = categories.filter(
  (c) => c.id === 'avtomatika' || c.parentId === 'avtomatika' || c.name.toLowerCase().includes('блок'),
);
for (const c of avt) {
  const n = products.filter((p) => p.categoryId === c.id).length;
  console.log(n, c.name, c.id, 'parent', c.parentId ?? '-');
}

const tree = collectCategoryTreeIds(categories, 'avtomatika');
console.log('tree total', products.filter((p) => tree.has(p.categoryId)).length);
