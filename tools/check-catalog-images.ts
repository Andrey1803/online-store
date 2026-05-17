import { readFile, access } from 'node:fs/promises';
import { join } from 'node:path';

const data = JSON.parse(await readFile('public/catalog/store.json', 'utf8'));
const products = data.products as { article?: string; image?: string; name: string }[];

const noImg = products.filter((p) => !p.image);
const withImg = products.filter((p) => p.image);

let missingFile = 0;
const broken: { article?: string; image: string; name: string }[] = [];

for (const p of withImg) {
  if (!p.image?.startsWith('/catalog/images/')) continue;
  const rel = p.image.replace(/^\//, '');
  try {
    await access(join('public', rel));
  } catch {
    missingFile++;
    if (broken.length < 10) broken.push({ article: p.article, image: p.image, name: p.name.slice(0, 50) });
  }
}

console.log('total products:', products.length);
console.log('no image field:', noImg.length);
console.log('with image field:', withImg.length);
console.log('image file missing on disk:', missingFile);
if (broken.length) console.log('broken samples:', broken);
if (noImg.length) {
  console.log('no image samples:', noImg.slice(0, 8).map((p) => p.article + ' ' + p.name.slice(0, 40)));
}
