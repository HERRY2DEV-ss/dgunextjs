// Local preview of the static export. Run npm run build first.
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../out');
const base = '/nextjs/homev1';
const port = Number(process.env.PORT || 3000);
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.txt': 'text/plain; charset=utf-8', '.xml': 'application/xml', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.pdf': 'application/pdf', '.mp4': 'video/mp4' };
if (!fs.existsSync(path.join(root, 'index.html'))) {
  console.error('Static export missing. Run npm run build before npm start.');
  process.exit(1);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT must be a number between 1 and 65535.');
  process.exit(1);
}
const server = http.createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let url, pathname;
  try { url = new URL(request.url, 'http://localhost'); pathname = decodeURIComponent(url.pathname); }
  catch { response.writeHead(400).end(); return; }
  if (pathname === '/' || pathname === base) {
    response.writeHead(307, { Location: base + '/' + url.search }).end();
    return;
  }
  if (!pathname.startsWith(base + '/') || pathname.includes('\0')) { response.writeHead(404).end(); return; }
  let file = path.resolve(root, '.' + pathname.slice(base.length));
  if (file !== root && !file.startsWith(root + path.sep)) { response.writeHead(404).end(); return; }
  try {
    try { if ((await fs.promises.stat(file)).isDirectory()) file = path.join(file, 'index.html'); }
    catch {
      const relative=pathname.slice(base.length);
      if (/^\/programs\/[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[1-9][0-9]*)?\/?$/i.test(relative)) file=path.join(root,'program-detail/index.html');
      else if (/^\/schools\/[a-z0-9]+(?:-[a-z0-9]+)*\/?$/i.test(relative)) file=path.join(root,'school-detail/index.html');
      else if (/^\/news\/[a-z0-9_-]+\/?$/i.test(relative)) file=path.join(root,'news/index.html');
      else throw new Error('Not a file');
    }
    if (!(await fs.promises.stat(file)).isFile()) throw new Error('Not a file');
    response.setHeader('Content-Type', mime[path.extname(file)] || 'application/octet-stream');
    response.setHeader('Cache-Control', pathname.includes('/_next/static/') ? 'public, max-age=31536000, immutable' : 'no-cache');
    if (request.method === 'HEAD') { response.end(); return; }
    const stream = fs.createReadStream(file);
    stream.on('error', () => { if (!response.headersSent) response.statusCode = 500; response.end(); });
    stream.pipe(response);
  } catch { response.writeHead(404).end(); }
});
server.on('error', error => { console.error(error.message); process.exitCode = 1; });
server.listen(port, '127.0.0.1', () => console.log(`Preview: http://127.0.0.1:${port}${base}/`));
