import { readFile } from 'node:fs/promises';
import * as XLSX from 'xlsx';
import { extractAllSheetImages } from '../src/lib/xlsxImages';
import { parseAkvabregFile } from '../src/lib/akvabregImport';

const xlsx = 'e:\\Для сортировки на удаления\\Мои документы\\Загрузки\\akvabreg_mega.xlsx';
const store = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const noImg = new Set(
  (store.products as { article?: string; image?: string }[])
    .filter((p) => !p.image)
    .map((p) => p.article),
);

const buf = await readFile(xlsx);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const sheetImages = await extractAllSheetImages(ab);
const result = await parseAkvabregFile(ab, { priceMode: 'rrc', importImages: true });

const parsedNoImg = result.products.filter((p) => !p.image && p.article);
console.log('no image in store:', noImg.size);
console.log('no image after parse:', parsedNoImg.length);

for (const p of parsedNoImg.slice(0, 20)) {
  const sheet = result.stats.sheets.find((s) =>
    result.products.some((x) => x.article === p.article),
  );
  console.log('article', p.article, 'name', p.name?.slice(0, 35));
}

// Check if sheet has any images at all for sheets of missing products
const wb = XLSX.read(ab, { type: 'array' });
let nearMiss = 0;
for (const sheetName of wb.SheetNames.slice(0, 5)) {
  const map = sheetImages.get(sheetName);
  if (!map) continue;
  console.log(sheetName, 'images on rows:', map.size);
}
