import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin, Connect } from 'vite';

// Cloudflare Pages 部署配置
// 构建命令: npm run build
// 输出目录: dist
// 无需任何构建期环境变量：登录时由用户填写接口域名与 token，
// 前端通过同源代理 /api-proxy 转发请求，后端无需开启 CORS。

// 本地开发 / 预览时，用 Vite 中间件实现与 Cloudflare Pages Function 一致的同源代理。
// 浏览器请求 /api-proxy/*，这里读取 x-target-domain / x-api-token 头，服务端转发。
function apiProxyPlugin(): Plugin {
  const handler: Connect.NextHandleFunction = async (req, res) => {
    const domain = (req.headers['x-target-domain'] as string) || '';
    const token = (req.headers['x-api-token'] as string) || '';
    let d = domain.trim();
    if (d && !/^https?:\/\//i.test(d)) d = 'https://' + d;
    d = d.replace(/\/+$/, '');

    if (!d) {
      res.statusCode = 400;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'bad_request', message: '缺少目标域名 (x-target-domain)' }));
      return;
    }

    // connect 在挂载 /api-proxy 时已剥离前缀，req.url 为剩余部分
    const rest = req.url && req.url.length ? req.url : '/';
    const sep = rest.includes('?') ? '&' : '?';
    const target = `${d}${rest}${sep}token=${encodeURIComponent(token)}`;

    // 收集请求体（支持 JSON 与 multipart/form-data 文件上传）
    const chunks: Buffer[] = [];
    try {
      for await (const c of req) chunks.push(c as Buffer);
    } catch {
      /* ignore */
    }
    const body = chunks.length ? Buffer.concat(chunks) : undefined;

    const headers: Record<string, string> = {};
    for (const [k, v] of Object.entries(req.headers)) {
      if (['x-target-domain', 'x-api-token', 'host', 'origin', 'referer', 'connection', 'content-length', 'transfer-encoding'].includes(k)) {
        continue;
      }
      if (Array.isArray(v)) headers[k] = v.join(', ');
      else if (v) headers[k] = String(v);
    }

    try {
      const upstream = await fetch(target, {
        method: req.method,
        headers,
        body: body && body.length ? body : undefined,
        redirect: 'follow',
      });
      res.statusCode = upstream.status;
      upstream.headers.forEach((v, k) => res.setHeader(k, v));
      const buf = Buffer.from(await upstream.arrayBuffer());
      res.end(buf);
    } catch (e) {
      res.statusCode = 502;
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify({ error: 'proxy_failed', detail: e instanceof Error ? e.message : String(e) }));
    }
  };

  return {
    name: 'api-proxy',
    configureServer(server) {
      server.middlewares.use('/api-proxy', handler);
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api-proxy', handler);
    },
  };
}

export default defineConfig({
  plugins: [react(), apiProxyPlugin()],
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
