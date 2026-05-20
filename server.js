import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const DIST = join(__dirname, 'dist');
const PORT = Number(process.env.PORT) || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = createServer(async (req, res) => {
  try {
    const raw = (req.url ?? '/').split('?')[0] || '/';
    const safe = normalize(raw).replace(/^(\.\.[/\\])+/, '');
    const rel = safe === '/' ? '/index.html' : safe;
    const filePath = join(DIST, rel);

    let data;
    const ext = extname(filePath);
    try {
      data = await readFile(filePath);
    } catch {
      if (ext && ext !== '.html') {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }
      data = await readFile(join(DIST, 'index.html'));
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.end(data);
      return;
    }
    res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
    const isHtml = ext === '.html' || ext === '';
    const isBuildInfo = rel === '/build-info.json';
    res.setHeader(
      'Cache-Control',
      isHtml || isBuildInfo
        ? 'no-cache, no-store, must-revalidate'
        : 'public, max-age=31536000, immutable',
    );
    res.end(data);
  } catch {
    res.statusCode = 500;
    res.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`nasos-magazin listening on http://0.0.0.0:${PORT}`);
});
