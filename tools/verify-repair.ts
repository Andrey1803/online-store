import { readFile } from 'node:fs/promises';
import { defaultCategories } from '../src/data/categories';
import { collectCategoryTreeIds } from '../src/lib/catalog';
import { repairProductCategories } from '../src/lib/categoryAssign';

const data = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const { products, categories } = repairProductCategories(
  data.products,
  data.categories ?? defaultCategories,
);

const roots = ['avtomatika', 'nasosy', 'baki', 'filtry', 'komplektuyushchie'];
for (const id of roots) {
  const ids = collectCategoryTreeIds(categories, id);
  const n = products.filter((p) => ids.has(p.categoryId)).length;
  console.log(id, n);
}
console.log('categories after prune:', categories.length, 'was', data.categories.length);
