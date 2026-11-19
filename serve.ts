// A tiny static file server for trying the app locally: `node serve.ts`, then open
// http://localhost:8080. It serves only the app/ folder beside this file, which is all the
// app needs — it runs fully offline in the browser.

import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), 'app');
const port = Number(process.env.PORT ?? 8080);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json',
};

createServer((req, res) => {
  const path = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  const file = path === root || !existsSync(path) || statSync(path).isDirectory()
    ? join(root, 'index.html')
    : path;
  if (!file.startsWith(root)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Leonida Cover Lab at http://localhost:${port}`));
