import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const origin = 'https://akvasnab.by';
const storePath = join(root, 'public', 'catalog', 'store.json');
const publicDir = join(root, 'public');

const store = JSON.parse(readFileSync(storePath, 'utf-8'));

const staticRoutes = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/catalog', priority: '0.9', changefreq: 'weekly' },
  { loc: '/delivery', priority: '0.5', changefreq: 'monthly' },
  { loc: '/contacts', priority: '0.6', changefreq: 'monthly' },
  { loc: '/about', priority: '0.5', changefreq: 'monthly' },
  { loc: '/terms', priority: '0.3', changefreq: 'yearly' },
  { loc: '/returns', priority: '0.4', changefreq: 'monthly' },
  { loc: '/privacy', priority: '0.3', changefreq: 'yearly' },
];

const categoryRoutes = (store.categories ?? []).map((c) => ({
  loc: `/catalog/${c.slug}`,
  priority: '0.8',
  changefreq: 'weekly',
}));

const productRoutes = (store.products ?? []).map((p) => ({
  loc: `/product/${p.slug}`,
  priority: '0.6',
  changefreq: 'weekly',
}));

const all = [...staticRoutes, ...categoryRoutes, ...productRoutes];
const today = new Date().toISOString().slice(0, 10);

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${all
  .map(
    (u) => `  <url>
    <loc>${origin}${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`,
  )
  .join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /admin
Disallow: /account
Disallow: /cart

Sitemap: ${origin}/sitemap.xml
`;

writeFileSync(join(publicDir, 'sitemap.xml'), xml, 'utf-8');
writeFileSync(join(publicDir, 'robots.txt'), robots, 'utf-8');
console.log(
  `sitemap.xml → ${all.length} URLs (${staticRoutes.length} static, ${categoryRoutes.length} categories, ${productRoutes.length} products)`,
);
console.log('robots.txt → ok');
