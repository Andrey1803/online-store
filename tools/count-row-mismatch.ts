import { readFile } from 'node:fs/promises';
import * as XLSX from 'xlsx';
import { extractAllSheetImages } from '../src/lib/xlsxImages';

const xlsx = 'e:\\Для сортировки на удаления\\Мои документы\\Загрузки\\akvabreg_mega.xlsx';
const buf = await readFile(xlsx);
const ab = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
const sheetImages = await extractAllSheetImages(ab);
const wb = XLSX.read(ab, { type: 'array' });

function findHeaderRow(rows: unknown[][]) {
  for (let i = 0; i < Math.min(rows.length, 30); i++) {
    const row = rows[i];
    if (!row) continue;
    const line = row.map((c) => String(c ?? '').toLowerCase()).join(' ');
    if (line.includes('артикул') && (line.includes('наимен') || line.includes('назван'))) {
      return i;
    }
  }
  return -1;
}

function isArticle(v: unknown): boolean {
  if (v == null) return false;
  const s = String(v).trim();
  return /^\d{4,}$/.test(s);
}

let strictMiss = 0;
let nearHit = 0;
let noNear = 0;

for (const sheetName of wb.SheetNames) {
  if (sheetName.toLowerCase() === 'меню') continue;
  const map = sheetImages.get(sheetName);
  if (!map?.size) continue;
  const sheet = wb.Sheets[sheetName];
  if (!sheet) continue;
  const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
  const headerIdx = findHeaderRow(rows);
  if (headerIdx < 0) continue;

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    const artIdx = rows[headerIdx].findIndex((c) =>
      String(c ?? '').toLowerCase().includes('артикул'),
    );
    if (artIdx < 0 || !isArticle(row[artIdx])) continue;

    const excelRow = i + 1;
    if (map.has(excelRow)) continue;
    strictMiss++;
    let found = false;
    for (let d = 1; d <= 3; d++) {
      if (map.has(excelRow - d) || map.has(excelRow + d)) {
        found = true;
        break;
      }
    }
    if (found) nearHit++;
    else noNear++;
  }
}

console.log('products without image on exact row:', strictMiss);
console.log('could fix with nearby row (±3):', nearHit);
console.log('no image nearby:', noNear);
