import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const products = data.products as { categoryId: string }[];
const categories = data.categories as { id: string; name: string; parentId?: string }[];

const count = new Map<string, number>();
for (const p of products) count.set(p.categoryId, (count.get(p.categoryId) ?? 0) + 1);

for (const c of categories.filter((x) => x.parentId === 'polipropilen')) {
  console.log(count.get(c.id) ?? 0, c.name);
}
