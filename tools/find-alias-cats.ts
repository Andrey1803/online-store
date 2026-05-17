import { readFile } from 'node:fs/promises';
import { SUBCATEGORY_PARENT } from '../src/lib/categoryHierarchy';
import { slugify } from '../src/lib/catalog';

const data = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const products = data.products as { categoryId: string }[];
const categories = data.categories as { id: string; slug: string; name: string; parentId?: string }[];

const countByCat = new Map<string, number>();
for (const p of products) {
  countByCat.set(p.categoryId, (countByCat.get(p.categoryId) ?? 0) + 1);
}

// Empty category names that have a similar named sibling with products
for (const c of categories) {
  if ((countByCat.get(c.id) ?? 0) > 0) continue;
  const prefix = c.name.slice(0, Math.min(28, c.name.length));
  const similar = categories.filter(
    (x) =>
      x.id !== c.id &&
      x.name.startsWith(prefix.slice(0, 20)) &&
      (countByCat.get(x.id) ?? 0) > 0,
  );
  if (similar.length) {
    console.log(`EMPTY: "${c.name}" (${c.id})`);
    for (const s of similar) {
      console.log(`  -> has products: "${s.name}" (${s.id}) n=${countByCat.get(s.id)}`);
    }
  }
}

// Check SUBCATEGORY_PARENT keys not matching any category with products
console.log('\n=== SUBCATEGORY_PARENT keys with 0 products ===');
for (const [name, parent] of Object.entries(SUBCATEGORY_PARENT)) {
  const slug = slugify(name);
  const cat = categories.find((c) => c.slug === slug || c.name === name);
  const n = cat ? countByCat.get(cat.id) ?? 0 : -1;
  if (n === 0) console.log(name, '->', parent, 'cat', cat?.id);
}
