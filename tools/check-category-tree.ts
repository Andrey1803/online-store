import { readFile } from 'node:fs/promises';
import { defaultCategories } from '../src/data/categories';
import { collectCategoryTreeIds } from '../src/lib/catalog';

const data = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const products = data.products as { categoryId: string }[];
const categories = data.categories as { id: string; slug: string; name: string; parentId?: string }[];

const countByCat = new Map<string, number>();
for (const p of products) {
  countByCat.set(p.categoryId, (countByCat.get(p.categoryId) ?? 0) + 1);
}

const roots = defaultCategories.filter((c) => !c.parentId);
console.log('=== Root categories (UI main) — products in tree ===');
for (const root of roots) {
  const ids = collectCategoryTreeIds(categories, root.id);
  const count = products.filter((p) => ids.has(p.categoryId)).length;
  const subs = categories.filter((c) => c.parentId === root.id);
  console.log(`${root.name} (${root.slug}): tree=${count} direct=${countByCat.get(root.id) ?? 0} subsInJson=${subs.length}`);
}

console.log('\n=== Roots with 0 products in tree ===');
for (const root of roots) {
  const ids = collectCategoryTreeIds(categories, root.id);
  const count = products.filter((p) => ids.has(p.categoryId)).length;
  if (count === 0) console.log('-', root.name, root.slug, root.id);
}

console.log('\n=== Categories with products but NO path to any root ===');
const rootIds = new Set(roots.map((r) => r.id));
function reachesRoot(catId: string, depth = 0): boolean {
  if (rootIds.has(catId)) return true;
  if (depth > 15) return false;
  const c = categories.find((x) => x.id === catId);
  if (!c?.parentId) return false;
  return reachesRoot(c.parentId, depth + 1);
}

const disconnected = categories.filter((c) => (countByCat.get(c.id) ?? 0) > 0 && !reachesRoot(c.id));
console.log('disconnected with products:', disconnected.length);
for (const c of disconnected.slice(0, 25)) {
  console.log(`  ${c.name} id=${c.id} parent=${c.parentId ?? '-'} products=${countByCat.get(c.id)}`);
}

console.log('\n=== Empty subcategories (shown in sidebar) ===');
const emptySubs = categories.filter(
  (c) => c.parentId && (countByCat.get(c.id) ?? 0) === 0,
);
console.log('count:', emptySubs.length);
for (const c of emptySubs.slice(0, 20)) {
  const parent = categories.find((p) => p.id === c.parentId);
  console.log(`  ${parent?.name} > ${c.name} (${c.slug})`);
}
