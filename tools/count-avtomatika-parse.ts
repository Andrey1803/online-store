import { readFile } from 'node:fs/promises';
import { parseAkvabregFile } from '../src/lib/akvabregImport';

const buf = await readFile(
  'e:\\Для сортировки на удаления\\Мои документы\\Загрузки\\akvabreg_mega.xlsx',
);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const r = await parseAkvabregFile(ab, { priceMode: 'rrc', importImages: false });
const m = new Map<string, number>();
for (const p of r.products) {
  m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1);
}
console.log('avtomatika', m.get('avtomatika') ?? 0);
console.log('total products', r.products.length);
const auto = [...m.entries()].filter(
  ([k]) =>
    k.includes('avtomat') ||
    k.includes('blok') ||
    k.includes('mehan') ||
    k.includes('elektr') ||
    k.includes('chastot'),
);
console.log('automation cats:', auto);
console.log('sum', auto.reduce((s, [, n]) => s + n, 0));
