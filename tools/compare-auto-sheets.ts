import { readFile } from 'node:fs/promises';
import { parseAkvabregFile } from '../src/lib/akvabregImport';

const buf = await readFile(
  'e:\\Для сортировки на удаления\\Мои документы\\Загрузки\\akvabreg_mega.xlsx',
);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);

const only = await parseAkvabregFile(ab, {
  priceMode: 'rrc',
  importImages: false,
  sheetFilter: 'Автоматика для насосов',
});
const full = await parseAkvabregFile(ab, { priceMode: 'rrc', importImages: false });

const onlyArts = new Set(only.products.map((p) => p.article));
let matchAvtomatika = 0;
let matchOther = new Map<string, number>();

for (const p of full.products) {
  if (!onlyArts.has(p.article)) continue;
  if (p.categoryId === 'avtomatika') matchAvtomatika++;
  else matchOther.set(p.categoryId, (matchOther.get(p.categoryId) ?? 0) + 1);
}

console.log('only sheet products', only.products.length);
console.log('same articles in full parse -> avtomatika', matchAvtomatika);
console.log('-> other top', [...matchOther.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10));
