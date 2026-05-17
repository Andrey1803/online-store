import * as XLSX from 'xlsx';
import type { Category } from '../data/categories';
import { defaultCategories } from '../data/categories';
import type { Product } from '../data/products';
import { slugify } from './catalog';
import { deduplicateProducts } from './productDedupe';
import { parseSpecsFromText } from './productSpecs';
import { resolveParentId } from './categoryHierarchy';
import { resolveProductCategoryName } from './categoryAssign';
import { extractAllSheetImages, imageForExcelRow, type SheetImageMap } from './xlsxImages';

export type PriceMode = 'opt2' | 'rrc' | 'markup';

export interface ImportOptions {
  priceMode: PriceMode;
  markupPercent: number;
  sheetFilter?: string;
  importImages?: boolean;
}

export interface ImportStats {
  totalRows: number;
  imported: number;
  skipped: number;
  noPrice: number;
  newCategories: number;
  withPhotos: number;
  sheets: string[];
}

export interface ImportResult {
  products: Product[];
  categories: Category[];
  stats: ImportStats;
}

const SKIP_SHEETS = new Set(['меню', 'menu', 'лист 47']);

const COLORS = ['#0ea5e9', '#0284c7', '#0369a1', '#0c4a6e', '#16a34a', '#64748b', '#ea580c'];

function parsePrice(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number' && !Number.isNaN(v)) return v;
  const s = String(v).trim().replace(',', '.');
  if (!s || /^уточняйте$/i.test(s) || s === '-') return null;
  const n = parseFloat(s);
  return Number.isNaN(n) ? null : n;
}

function isArticle(v: unknown): boolean {
  if (v === null || v === undefined) return false;
  return /^\d{8,14}$/.test(String(v).trim());
}

function findHeaderRow(rows: unknown[][]): { index: number; cols: Record<string, number> } | null {
  for (let i = 0; i < Math.min(rows.length, 20); i++) {
    const row = rows[i];
    if (!row) continue;
    const cells = row.map((c) => String(c ?? '').toLowerCase());
    const artIdx = cells.findIndex((c) => c.includes('артикул'));
    if (artIdx < 0) continue;
    const col = (names: string[]) =>
      cells.findIndex((c) => names.some((n) => c.includes(n)));
    return {
      index: i,
      cols: {
        article: artIdx,
        photo: col(['фото']),
        brand: col(['бренд']),
        type: col(['тип']),
        name: col(['наименование']),
        desc: col(['описание', 'краткое']),
        opt1: col(['опт 1']),
        opt2: col(['опт 2']),
        rrc: col(['ррц']),
      },
    };
  }
  return null;
}

function pickPrice(
  opt2: number | null,
  rrc: number | null,
  mode: PriceMode,
  markupPercent: number,
): { price: number; oldPrice?: number } | null {
  if (mode === 'rrc') {
    if (!rrc) return null;
    return { price: rrc };
  }
  if (mode === 'opt2') {
    if (!opt2) return null;
    return { price: opt2 };
  }
  if (mode === 'markup' && opt2) {
    const price = Math.round(opt2 * (1 + markupPercent / 100) * 100) / 100;
    return { price, oldPrice: rrc && rrc > price ? rrc : undefined };
  }
  if (rrc) return { price: rrc };
  if (opt2) return { price: opt2 };
  return null;
}

function colorFromArticle(article: string): string {
  let h = 0;
  for (let i = 0; i < article.length; i++) h = (h + article.charCodeAt(i)) % COLORS.length;
  return COLORS[h]!;
}

function ensureCategory(
  name: string,
  categories: Map<string, Category>,
  sheetName?: string,
): string {
  const trimmed = name.trim();
  const slug = slugify(trimmed);
  const existing = [...categories.values()].find(
    (c) => c.slug === slug || c.name.toLowerCase() === trimmed.toLowerCase(),
  );
  if (existing) return existing.id;

  const mappedParent = resolveParentId(trimmed, sheetName);
  let parentId: string | undefined = mappedParent;
  if (mappedParent && !categories.has(mappedParent)) {
    const parentCat = defaultCategoryById(mappedParent);
    if (parentCat) categories.set(parentCat.id, parentCat);
  }

  let id = slug || `cat-${categories.size}`;
  if (parentId && id === parentId) id = `${id}-cat`;
  categories.set(id, {
    id,
    slug: slug || id,
    name: trimmed,
    description: '',
    icon: '📦',
    parentId,
  });
  return id;
}

function defaultCategoryById(id: string): Category | undefined {
  return defaultCategories.find((c) => c.id === id);
}

function parseSheet(
  rows: unknown[][],
  sheetName: string,
  categories: Map<string, Category>,
  options: ImportOptions,
  stats: ImportStats,
  imageByRow?: SheetImageMap,
): Product[] {
  const header = findHeaderRow(rows);
  if (!header) return [];

  const { cols } = header;
  const products: Product[] = [];
  const usedSlugs = new Set<string>();

  for (let i = header.index + 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row) continue;
    stats.totalRows++;

    const get = (key: keyof typeof cols) => {
      const idx = cols[key];
      return idx >= 0 ? row[idx] : undefined;
    };

    const articleRaw = get('article');
    if (!isArticle(articleRaw)) continue;

    const article = String(articleRaw).trim();
    const name = String(get('name') ?? '').trim();
    if (!name) {
      stats.skipped++;
      continue;
    }

    const opt2 = parsePrice(get('opt2'));
    const rrc = parsePrice(get('rrc'));
    const priced = pickPrice(opt2, rrc, options.priceMode, options.markupPercent);
    if (!priced) {
      stats.noPrice++;
      continue;
    }

    const typeName = String(get('type') ?? '').trim();
    const description = String(get('desc') ?? '').trim() || name;
    const categoryName = resolveProductCategoryName(name, typeName, sheetName, description);
    const categoryId = ensureCategory(categoryName, categories, sheetName);

    let slug = slugify(name);
    if (usedSlugs.has(slug)) slug = `${slug}-${article.slice(-6)}`;
    usedSlugs.add(slug);

    const photo = get('photo');
    let image: string | undefined;
    if (photo && String(photo).startsWith('http')) {
      image = String(photo).trim();
    } else {
      const rowImage = imageForExcelRow(i + 1, imageByRow);
      if (rowImage) {
        image = rowImage;
        stats.withPhotos++;
      }
    }

    products.push({
      id: article,
      slug,
      article,
      name,
      brand: String(get('brand') ?? '').trim() || '—',
      categoryId,
      price: priced.price,
      oldPrice: priced.oldPrice,
      description,
      specs: parseSpecsFromText(`${name} ${description}`),
      inStock: true,
      featured: false,
      imageColor: colorFromArticle(article),
      image,
    });
    stats.imported++;
  }

  return products;
}

export async function parseAkvabregFile(
  buffer: ArrayBuffer,
  options: ImportOptions,
  existingCategories: Category[] = [],
  onProgress?: (message: string) => void,
): Promise<ImportResult> {
  const workbook = XLSX.read(buffer, { type: 'array' });
  const categories = new Map<string, Category>(existingCategories.map((c) => [c.id, c]));
  const initialSize = categories.size;
  const allProducts: Product[] = [];
  const stats: ImportStats = {
    totalRows: 0,
    imported: 0,
    skipped: 0,
    noPrice: 0,
    newCategories: 0,
    withPhotos: 0,
    sheets: [],
  };

  let sheetImages = new Map<string, SheetImageMap>();
  if (options.importImages) {
    onProgress?.('Извлекаем фото из Excel…');
    sheetImages = await extractAllSheetImages(buffer);
  }

  const sheetNames = workbook.SheetNames.filter((n) => !SKIP_SHEETS.has(n.toLowerCase().trim()));

  for (const sheetName of sheetNames) {
    if (options.sheetFilter && sheetName !== options.sheetFilter) continue;
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    if (!rows.length) continue;
    stats.sheets.push(sheetName);
    onProgress?.(`Разбор: ${sheetName}…`);
    const products = parseSheet(
      rows,
      sheetName,
      categories,
      options,
      stats,
      sheetImages.get(sheetName),
    );
    allProducts.push(...products);
  }

  stats.newCategories = categories.size - initialSize;

  const products = deduplicateProducts(allProducts);
  stats.imported = products.length;

  return {
    products,
    categories: [...categories.values()],
    stats,
  };
}

/** Только фото из Excel в оригинальном качестве (без пережатия) */
export async function extractImageEntriesFromExcel(
  buffer: ArrayBuffer,
  onProgress?: (message: string) => void,
): Promise<{ article: string; dataUrl: string }[]> {
  onProgress?.('Извлекаем фото из Excel…');
  const sheetImages = await extractAllSheetImages(buffer);
  const workbook = XLSX.read(buffer, { type: 'array' });
  const entries: { article: string; dataUrl: string }[] = [];
  const seen = new Set<string>();

  const sheetNames = workbook.SheetNames.filter((n) => !SKIP_SHEETS.has(n.toLowerCase().trim()));

  for (const sheetName of sheetNames) {
    const sheet = workbook.Sheets[sheetName];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: null });
    const header = findHeaderRow(rows);
    const imageByRow = sheetImages.get(sheetName);
    if (!header || !imageByRow?.size) continue;

    onProgress?.(`Фото: ${sheetName}…`);
    const artCol = header.cols.article;

    for (let i = header.index + 1; i < rows.length; i++) {
      const row = rows[i];
      if (!row) continue;
      const articleRaw = row[artCol];
      if (!isArticle(articleRaw)) continue;

      const article = String(articleRaw).trim();
      const dataUrl = imageByRow.get(i + 1);
      if (!dataUrl || seen.has(article)) continue;

      seen.add(article);
      entries.push({ article, dataUrl });
    }
  }

  return entries;
}
