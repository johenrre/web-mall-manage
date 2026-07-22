/**
 * Vue 管理后台生产构建静态服务。
 * 使用前先执行 npm run build，再执行 npm run serve。
 */
import http from 'node:http'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const PORT = Number(process.env.ADMIN_PORT || 3001)
const BACKEND_TARGET = process.env.BACKEND_TARGET || 'http://127.0.0.1:5173'
const ROOT = path.resolve(__dirname, 'dist')

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
}

function proxyRequest(req, res, targetPath) {
  const targetUrl = new URL(targetPath, BACKEND_TARGET)
  const headers = { ...req.headers }
  delete headers.host
  const proxyReq = http.request(
    { hostname: targetUrl.hostname, port: targetUrl.port, path: targetUrl.pathname + targetUrl.search, method: req.method, headers },
    (proxyRes) => {
      const responseHeaders = { ...proxyRes.headers }
      delete responseHeaders['content-encoding']
      res.writeHead(proxyRes.statusCode || 502, responseHeaders)
      proxyRes.pipe(res)
    },
  )
  proxyReq.on('error', () => {
    res.writeHead(502, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ code: 502, message: '后端服务不可用' }))
  })
  req.pipe(proxyReq)
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/uploads/')) {
    return proxyRequest(req, res, url.pathname + url.search)
  }
  // 保留旧路径兼容：/backend/api/* → /api/*
  if (url.pathname.startsWith('/backend/api/')) {
    return proxyRequest(req, res, url.pathname.replace(/^\/backend/, '') + url.search)
  }

  const requested = url.pathname === '/' ? 'index.html' : url.pathname.replace(/^\/+/, '')
  const filePath = path.resolve(ROOT, requested)
  if (!filePath.startsWith(`${ROOT}${path.sep}`) && filePath !== path.join(ROOT, 'index.html')) {
    res.writeHead(403).end('Forbidden')
    return
  }

  fs.readFile(filePath, (error, data) => {
    if (!error) {
      res.writeHead(200, { 'Content-Type': MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream' })
      res.end(data)
      return
    }
    fs.readFile(path.join(ROOT, 'index.html'), (fallbackError, fallback) => {
      if (fallbackError) {
        res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
        res.end('管理后台尚未构建，请先执行 npm run build')
        return
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end(fallback)
    })
  })
})

server.listen(PORT, () => {
  console.log(`管理后台已启动：http://localhost:${PORT}`)
  console.log(`后端代理：${BACKEND_TARGET}`)
})
