const http = require('http');
const fs = require('fs');
const path = require('path');

const CONTENT_TYPES = {
    '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.ico': 'image/x-icon'
};

function createStaticServer(rootDirectory, port = 4173) {
    const root = path.resolve(rootDirectory);
    const server = http.createServer((request, response) => {
        const boundPort = server.address()?.port || port;
        const host = String(request.headers.host || '').toLowerCase();
        const allowedHosts = [`localhost:${boundPort}`, `127.0.0.1:${boundPort}`, `[::1]:${boundPort}`];
        if (!allowedHosts.includes(host)) { response.writeHead(403).end('Forbidden'); return; }
        if (!['GET', 'HEAD'].includes(request.method)) { response.writeHead(405).end('Method not allowed'); return; }

        let pathname;
        try { pathname = decodeURIComponent(new URL(request.url, `http://localhost:${boundPort}`).pathname); }
        catch { response.writeHead(400).end('Bad request'); return; }
        const segments = pathname.split('/').filter(Boolean);
        if (segments.some(segment => segment.startsWith('.') || ['dist', 'node_modules'].includes(segment))) { response.writeHead(403).end('Forbidden'); return; }
        const filePath = path.resolve(root, `.${pathname}`);
        if (filePath !== root && !filePath.startsWith(`${root}${path.sep}`)) { response.writeHead(403).end('Forbidden'); return; }

        fs.stat(filePath, (error, stat) => {
            if (error || !stat.isFile()) { response.writeHead(404).end('Not found'); return; }
            response.writeHead(200, {
                'Content-Type': CONTENT_TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
                'X-Content-Type-Options': 'nosniff',
                'Cache-Control': 'no-cache'
            });
            if (request.method === 'HEAD') { response.end(); return; }
            fs.createReadStream(filePath).pipe(response);
        });
    });
    return server;
}

module.exports = { createStaticServer };
