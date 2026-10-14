// Local dev server: serves the static PWA and mounts ./api/*.js like Vercel does.   node dev-server.js  -> http://localhost:3000
// Without KV_REST_API_URL the API uses an in-memory DB (lost on restart) — local development only.
const http = require('http'), fs = require('fs'), path = require('path');
const PORT = process.env.PORT || 3000;
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach((l) => { const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(l); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, ''); });
} catch (e) { /* no .env */ }
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname.startsWith('/api/')) {
    const name = url.pathname.slice(5).replace(/[^\w-]/g, '');
    let mod;
    try { mod = require('./api/' + name + '.js'); } catch (e) { res.statusCode = 404; return res.end('{"error":"not_found"}'); }
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      req.query = Object.fromEntries(url.searchParams);
      const raw = Buffer.concat(chunks).toString();
      try { req.body = raw && /json/.test(req.headers['content-type'] || '') ? JSON.parse(raw) : raw; } catch (e) { req.body = raw; }
      mod(req, res);
    });
    return;
  }
  const p = path.join(__dirname, decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname));
  if (!p.startsWith(__dirname) || p.includes(path.sep + 'api' + path.sep)) { res.statusCode = 403; return res.end(); }
  fs.readFile(p, (e, data) => {
    if (e) { res.statusCode = 404; return res.end('Not found'); }
    res.setHeader('Content-Type', TYPES[path.extname(p)] || 'application/octet-stream');
    if (p.endsWith('sw.js')) res.setHeader('Cache-Control', 'no-cache');
    res.end(data);
  });
}).listen(PORT, () => console.log('Weather Wardrobe dev server: http://localhost:' + PORT));
