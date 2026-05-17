import { readFile } from 'node:fs/promises';
import { collectCategoryTreeIds } from '../src/lib/catalog';
import { defaultCategories } from '../src/data/categories';

const data = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const products = data.products as { categoryId: string }[];
const categories = data.categories as { id: string; slug: string; name: string; parentId?: string }[];

const countByCat = new Map<string, number>();
for (const p of products) {
  countByCat.set(p.categoryId, (countByCat.get(p.categoryId) ?? 0) + 1);
}

for (const c of categories) {
  if (!c.parentId) continue;
  const direct = countByCat.get(c.id) ?? 0;
  const tree = products.filter((p) => collectCategoryTreeIds(categories, c.id).has(p.categoryId)).length;
  if (direct === 0 && tree === 0) {
    const parent = categories.find((x) => x.id === c.parentId);
    console.log(`${parent?.name} > ${c.name} | id=${c.id}`);
  }
}
