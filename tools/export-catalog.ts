/**
 * Экспорт каталога и фото из Excel в public/catalog/ для деплоя на Railway.
 * Использование: npm run export-catalog -- "C:\path\to\akvabreg_mega.xlsx"
 */
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { repairProductCategories } from '../src/lib/categoryAssign';
import { parseAkvabregFile } from '../src/lib/akvabregImport';
import { defaultCategories } from '../src/data/categories';
import { PRODUCT_IMAGES_PREFIX } from '../src/lib/serverCatalog';
import type { Product } from '../src/data/products';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const OUT_DIR = join(ROOT, 'public', 'catalog');
const IMG_DIR = join(ROOT, 'public', 'product-images');

function extFromDataUrl(dataUrl: string): string {
  const m = /^data:image\/([\w+.-]+);/i.exec(dataUrl);
  if (!m) return 'jpg';
  const t = m[1].toLowerCase();
  if (t === 'jpeg') return 'jpg';
  if (t === 'svg+xml') return 'svg';
  return t.replace('+xml', '');
}

function dataUrlToBuffer(dataUrl: string): Buffer {
  const i = dataUrl.indexOf(',');
  if (i < 0) throw new Error('Некорректный data URL');
  return Buffer.from(dataUrl.slice(i + 1), 'base64');
}

async function main() {
  const xlsxPath = process.argv[2];
  if (!xlsxPath) {
    console.error('Укажите путь к .xlsx:\n  npm run export-catalog -- "C:\\path\\akvabreg_mega.xlsx"');
    process.exit(1);
  }

  const bytes = await readFile(xlsxPath);
  const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);

  console.log('Парсим прайс и извлекаем фото…');
  const result = await parseAkvabregFile(
    arrayBuffer,
    { priceMode: 'rrc', markupPercent: 0, importImages: true },
    undefined,
    (msg) => process.stdout.write(`\r${msg}                    `),
  );
  console.log(`\nТоваров: ${result.products.length}, с фото в прайсе: ${result.stats.withPhotos}`);

  await mkdir(OUT_DIR, { recursive: true });
  await rm(IMG_DIR, { recursive: true, force: true });
  await mkdir(IMG_DIR, { recursive: true });

  let savedImages = 0;
  const products: Product[] = [];

  for (const p of result.products) {
    let image = p.image;
    if (image?.startsWith('data:') && p.article) {
      const ext = extFromDataUrl(image);
      const fileName = `${encodeURIComponent(p.article)}.${ext}`;
      await writeFile(join(IMG_DIR, fileName), dataUrlToBuffer(image));
      image = `${PRODUCT_IMAGES_PREFIX}${fileName}`;
      savedImages++;
    } else if (image?.startsWith('http')) {
      /* внешние URL оставляем как есть */
    } else {
      image = undefined;
    }
    products.push({ ...p, image });
  }

  const repaired = repairProductCategories(products, result.categories ?? defaultCategories);

  const bundle = {
    version: 1,
    exportedAt: new Date().toISOString(),
    products: repaired.products,
    categories: repaired.categories,
  };

  await writeFile(join(OUT_DIR, 'store.json'), JSON.stringify(bundle), 'utf8');

  console.log(`Готово: public/catalog/store.json`);
  console.log(`Файлов фото: ${savedImages} в public/product-images/`);
  console.log('Дальше: git add public/catalog && git commit && git push (деплой на Railway).');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
