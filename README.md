# DIY 商城管理后台

基于 Vue 3、TypeScript、Axios、Vue Router 和 Ant Design Vue 的管理后台。

## 本地开发

先启动 `backend-node`（默认端口 3000），再执行：

```bash
npm install
npm run dev
```

后台地址：<http://localhost:3001/>

Vite 会把 `/api/*` 和 `/uploads/*` 代理到 `http://127.0.0.1:3000`。如需连接其他后端，可在 `.env.local` 中设置：

```dotenv
VITE_API_BASE=http://127.0.0.1:3000
```

## 生产构建

```bash
npm run build
npm run serve
```

`npm run serve` 会托管 `dist`，默认监听 3001，并代理后端请求到 3000。可通过 `ADMIN_PORT` 和 `BACKEND_TARGET` 环境变量覆盖端口与后端地址。

## 入口说明

- 新版入口：`index.html`
- 兼容入口 `admin.html` 只负责跳转；开发环境访问 `/admin.html` 会自动进入新版入口。
- 功能范围见 [管理后台功能需求文档.md](./管理后台功能需求文档.md)。
