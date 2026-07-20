/**
 * 后台管理页面 admin.html 静态服务
 * - 提供 admin.html 及静态资源
 * - 代理 /backend/api/* 到 backend-node (http://127.0.0.1:3000/api/*)
 * - 代理 /uploads/* 到 backend-node (http://127.0.0.1:3000/uploads/*)
 */
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');

const PORT = 3001;
const BACKEND_TARGET = 'http://127.0.0.1:3000';
const ROOT = __dirname;

// MIME 类型映射
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

/** 代理请求到后端 */
function proxyRequest(req, res, targetPath) {
  const targetUrl = new URL(targetPath, BACKEND_TARGET);
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port,
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: { ...req.headers },
  };

  // 修正 host header
  delete options.headers.host;

  const proxyReq = http.request(options, (proxyRes) => {
    // 转发后端响应头
    const statusCode = proxyRes.statusCode;
    const headers = { ...proxyRes.headers };
    delete headers['content-encoding']; // 避免压缩问题
    res.writeHead(statusCode, headers);
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (err) => {
    console.error('[proxy error]', err.message);
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ code: 502, message: '后端服务不可用' }));
  });

  // 转发请求体
  req.pipe(proxyReq);
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  console.log(`[${req.method}] ${pathname}`);

  // === 代理规则 ===
  // /backend/api/* → http://127.0.0.1:3000/api/*
  if (pathname.startsWith('/backend/api/')) {
    const targetPath = pathname.replace(/^\/backend/, '') + url.search;
    return proxyRequest(req, res, targetPath);
  }

  // /uploads/* → http://127.0.0.1:3000/uploads/*
  if (pathname.startsWith('/uploads/')) {
    return proxyRequest(req, res, pathname + url.search);
  }

  // === 静态文件服务 ===
  let filePath = path.join(ROOT, pathname === '/' ? 'admin.html' : pathname);

  // 安全校验：防止目录遍历
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // 找不到则当作 SPA fallback 到 admin.html
        const fallback = path.join(ROOT, 'admin.html');
        fs.readFile(fallback, (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(data2);
        });
      } else {
        res.writeHead(500);
        res.end('Internal Server Error');
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`\n  ✅ 后台管理页面已启动`);
  console.log(`  📍 地址: http://localhost:${PORT}/`);
  console.log(`  🔗 后端代理: ${BACKEND_TARGET}`);
  console.log(`  ⚡ 按 Ctrl+C 停止服务\n`);
});
