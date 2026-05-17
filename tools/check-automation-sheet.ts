import { readFile } from 'node:fs/promises';
import * as XLSX from 'xlsx';
import { parseAkvabregFile } from '../src/lib/akvabregImport';

const buf = await readFile(
  'e:\\Для сортировки на удаления\\Мои документы\\Загрузки\\akvabreg_mega.xlsx',
);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const wb = XLSX.read(ab, { type: 'array' });
console.log(
  'automation sheets:',
  wb.SheetNames.filter((n) => /автомат/i.test(n)),
);

for (const name of ['Автоматика для насосов', 'Автоматические трубные муфты']) {
  const r = await parseAkvabregFile(ab, {
    priceMode: 'rrc',
    importImages: false,
    sheetFilter: name,
  });
  const m = new Map<string, number>();
  for (const p of r.products) {
    m.set(p.categoryId, (m.get(p.categoryId) ?? 0) + 1);
  }
  console.log('\n', name, '->', r.products.length, 'products');
  console.log([...m.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8));
}
