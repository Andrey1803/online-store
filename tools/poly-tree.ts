import { readFileSync } from 'node:fs';

const d = JSON.parse(readFileSync('public/catalog/store.json', 'utf8'));
const cats = d.categories as { id: string; name: string; parentId?: string }[];
const poly = cats.filter((c) => c.parentId === 'polipropilen');
console.log('Direct children of polipropilen:', poly.length);
for (const c of poly.sort((a, b) => a.name.localeCompare(b.name, 'ru'))) {
  const n = d.products.filter((p: { categoryId: string }) => p.categoryId === c.id).length;
  const kids = cats.filter((x) => x.parentId === c.id);
  console.log(`- ${c.name} (${n}) sub:${kids.length}`);
  for (const k of kids) {
    const kn = d.products.filter((p: { categoryId: string }) => p.categoryId === k.id).length;
    console.log(`    └ ${k.name} (${kn})`);
  }
}
