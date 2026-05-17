import { readFile } from 'node:fs/promises';
import { parseAkvabregFile } from '../src/lib/akvabregImport';

const buf = await readFile(
  'e:\\Для сортировки на удаления\\Мои документы\\Загрузки\\akvabreg_mega.xlsx',
);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const r = await parseAkvabregFile(ab, { priceMode: 'rrc', importImages: false });

const byArt = new Map<string, Set<string>>();
for (const p of r.products) {
  if (!p.article) continue;
  const k = p.article.toLowerCase();
  if (!byArt.has(k)) byArt.set(k, new Set());
  byArt.get(k)!.add(p.categoryId);
}
let multi = 0;
let withAvtomatika = 0;
for (const [art, cats] of byArt) {
  if (cats.size > 1) {
    multi++;
    if (cats.has('avtomatika')) withAvtomatika++;
  }
}
console.log('unique articles', byArt.size);
console.log('articles in multiple categories', multi);
console.log('including avtomatika', withAvtomatika);
