import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const products = data.products as { categoryId: string; article?: string }[];
const categories = data.categories as { id: string; slug: string; name: string; parentId?: string }[];

const countByCat = new Map<string, number>();
for (const p of products) {
  countByCat.set(p.categoryId, (countByCat.get(p.categoryId) ?? 0) + 1);
}

const empty = categories.filter((c) => !countByCat.get(c.id));
const main = categories.filter((c) => !c.parentId);
const emptyMain = main.filter((c) => !countByCat.get(c.id));

console.log('categories:', categories.length, 'products:', products.length);
console.log('empty categories (no direct products):', empty.length);
console.log('empty MAIN categories:', emptyMain.length);
console.log('\nEmpty main (first 20):');
for (const c of emptyMain.slice(0, 20)) {
  const subs = categories.filter((x) => x.parentId === c.id);
  const subWithProducts = subs.filter((s) => (countByCat.get(s.id) ?? 0) > 0);
  console.log(`- ${c.name} (${c.slug}) subs=${subs.length} subsWithProducts=${subWithProducts.length}`);
}

const orphanIds = new Set<string>();
for (const p of products) {
  if (!categories.some((c) => c.id === p.categoryId)) orphanIds.add(p.categoryId);
}
console.log('\norphan categoryIds on products:', orphanIds.size);
if (orphanIds.size) console.log([...orphanIds].slice(0, 10));
