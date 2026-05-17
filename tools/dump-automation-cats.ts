import { readFile } from 'node:fs/promises';
import { parseAkvabregFile } from '../src/lib/akvabregImport';
import { collectCategoryTreeIds } from '../src/lib/catalog';

const buf = await readFile(
  'e:\\Для сортировки на удаления\\Мои документы\\Загрузки\\akvabreg_mega.xlsx',
);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const r = await parseAkvabregFile(ab, { priceMode: 'rrc', importImages: false });

const tree = collectCategoryTreeIds(r.categories, 'avtomatika');
const inTree = r.products.filter((p) => tree.has(p.categoryId)).length;
console.log('products in avtomatika tree (parse):', inTree);

const names = new Map<string, number>();
for (const p of r.products) {
  if (!tree.has(p.categoryId)) continue;
  const c = r.categories.find((x) => x.id === p.categoryId);
  names.set(c?.name ?? p.categoryId, (names.get(c?.name ?? p.categoryId) ?? 0) + 1);
}
console.log([...names.entries()].sort((a, b) => b[1] - a[1]));
