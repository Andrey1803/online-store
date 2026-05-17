import { readFile } from 'node:fs/promises';

const data = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const products = data.products as { categoryId: string; name: string; description: string }[];
const categories = data.categories as { id: string; name: string; parentId?: string }[];
const cat = new Map(categories.map((c) => [c.id, c]));

const hits = products.filter((p) => {
  const t = `${p.name} ${p.description}`.toLowerCase();
  return /реле|давлен|частот|привод|контрол|акваробот|гидроконтрол|pm-\d|ps-\d|механическ|электронн.*блок/.test(t);
});

const byCat = new Map<string, number>();
for (const p of hits) {
  const c = cat.get(p.categoryId);
  const k = c ? `${c.name} (${c.parentId ?? 'root'})` : p.categoryId;
  byCat.set(k, (byCat.get(k) ?? 0) + 1);
}
console.log('relay/automation products:', hits.length);
console.log([...byCat.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20));
