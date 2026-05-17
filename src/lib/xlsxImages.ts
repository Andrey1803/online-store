import JSZip from 'jszip';
import { blobToStoredDataUrl } from '../utils/imageUpload';

/** 1-based номер строки Excel → data URL */
export type SheetImageMap = Map<number, string>;

export async function extractAllSheetImages(
  buffer: ArrayBuffer,
): Promise<Map<string, SheetImageMap>> {
  const zip = await JSZip.loadAsync(buffer);
  const result = new Map<string, SheetImageMap>();

  const workbookXml = await readZipText(zip, 'xl/workbook.xml');
  const workbookRels = await readZipText(zip, 'xl/_rels/workbook.xml.rels');
  if (!workbookXml || !workbookRels) return result;

  const sheets = parseWorkbookSheets(workbookXml, workbookRels);

  for (const sheet of sheets) {
    const sheetRelsPath = `xl/worksheets/_rels/sheet${sheet.index}.xml.rels`;
    const sheetRels = await readZipText(zip, sheetRelsPath);
    if (!sheetRels) continue;

    const drawingFile = parseDrawingPath(sheetRels);
    if (!drawingFile) continue;

    const drawingPath = `xl/drawings/${drawingFile}`;
    const drawingXml = await readZipText(zip, drawingPath);
    if (!drawingXml) continue;

    const drawingRelsPath = `xl/drawings/_rels/${drawingFile}.rels`;
    const drawingRels = await readZipText(zip, drawingRelsPath);
    if (!drawingRels) continue;

    const embedToMedia = parseDrawingRels(drawingRels);
    const anchors = parseDrawingAnchors(drawingXml);
    const rowMap: SheetImageMap = new Map();

    for (const { row, embedId } of anchors) {
      const mediaPath = embedToMedia.get(embedId);
      if (!mediaPath) continue;
      const fileName = mediaPath.split('/').pop() ?? mediaPath;
      const file =
        zip.file(`xl/media/${fileName}`) ??
        zip.file(mediaPath.startsWith('xl/') ? mediaPath : `xl/media/${mediaPath}`);
      if (!file) continue;

      const blob = await file.async('blob');
      try {
        const dataUrl = await blobToStoredDataUrl(blob);
        const excelRow = row + 1;
        if (!rowMap.has(excelRow)) {
          rowMap.set(excelRow, dataUrl);
        }
      } catch {
        /* skip broken image */
      }
    }

    if (rowMap.size > 0) {
      result.set(sheet.name, rowMap);
    }
  }

  return result;
}

async function readZipText(zip: JSZip, path: string): Promise<string | null> {
  const file = zip.file(path);
  if (!file) return null;
  return file.async('string');
}

interface SheetInfo {
  name: string;
  index: number;
}

function parseWorkbookSheets(workbookXml: string, relsXml: string): SheetInfo[] {
  const relMap = new Map<string, string>();
  const relRe = /Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = relRe.exec(relsXml))) {
    relMap.set(m[1], m[2].replace(/^\.\.\//, 'xl/'));
  }

  const sheets: SheetInfo[] = [];
  const sheetRe = /<sheet[^>]*name="([^"]+)"[^>]*r:id="([^"]+)"/g;
  let i = 0;
  while ((m = sheetRe.exec(workbookXml))) {
    i++;
    const target = relMap.get(m[2]);
    const indexMatch = target?.match(/sheet(\d+)\.xml/);
    sheets.push({
      name: m[1],
      index: indexMatch ? Number(indexMatch[1]) : i,
    });
  }
  return sheets;
}

function parseDrawingPath(sheetRelsXml: string): string | null {
  const m = sheetRelsXml.match(/Target="\.\.\/drawings\/([^"]+)"/);
  return m ? m[1] : null;
}

function parseDrawingRels(relsXml: string): Map<string, string> {
  const map = new Map<string, string>();
  const re = /Id="([^"]+)"[^>]*Target="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(relsXml))) {
    map.set(m[1], m[2].replace(/^\.\.\/media\//, ''));
  }
  return map;
}

function parseDrawingAnchors(drawingXml: string): { row: number; embedId: string }[] {
  const anchors: { row: number; embedId: string }[] = [];
  const blocks = drawingXml.split(/<xdr:oneCellAnchor|<xdr:twoCellAnchor/).slice(1);

  for (const block of blocks) {
    const rowMatch = block.match(/<xdr:row>(\d+)<\/xdr:row>/);
    const embedMatch = block.match(/r:embed="([^"]+)"/);
    if (!rowMatch || !embedMatch) continue;
    anchors.push({ row: Number(rowMatch[1]), embedId: embedMatch[1] });
  }

  return anchors;
}

