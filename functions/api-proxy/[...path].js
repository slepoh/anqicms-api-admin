// Cloudflare Pages Function：同源代理
// 浏览器只请求本站 /api-proxy/*，本函数读取请求头中的目标域名(x-target-domain)与
// token(x-api-token)，在服务端转发到真实接口并以流式返回结果。
// 这样前端无需后端开启 CORS；token 也不再由浏览器跨域直接发送。
//
// 部署：将整个项目（含 functions/ 目录）连接到 Cloudflare Pages 即可自动启用，
// 无需额外构建步骤。本地用 `wrangler dev` 或本项目 Vite 中间件也可联调。

function normalizeDomain(domain) {
  let d = (domain || '').trim();
  if (!d) return '';
  if (!/^https?:\/\//i.test(d)) d = 'https://' + d;
  return d.replace(/\/+$/, '');
}

export async function onRequest(context) {
  const { request } = context;
  const url = new URL(request.url);

  const domain = normalizeDomain(request.headers.get('x-target-domain'));
  const token = request.headers.get('x-api-token') || '';

  if (!domain) {
    return new Response(
      JSON.stringify({ error: 'bad_request', message: '缺少目标域名 (x-target-domain)' }),
      { status: 400, headers: { 'content-type': 'application/json; charset=utf-8' } },
    );
  }

  // 去掉 /api-proxy 前缀后的真实路径与查询
  const rest = url.pathname.replace(/^\/api-proxy/, '') || '/';
  const target = `${domain}${rest}${url.search}`;

  // 接口约定 token 放在 query 中（与原始前端一致）
  const sep = target.includes('?') ? '&' : '?';
  const finalTarget = `${target}${sep}token=${encodeURIComponent(token)}`;

  // 转发请求头，但剥离与代理/跨域相关的头
  const headers = new Headers(request.headers);
  headers.delete('x-target-domain');
  headers.delete('x-api-token');
  headers.delete('host');
  headers.delete('origin');
  headers.delete('referer');
  headers.delete('connection');

  const init = {
    method: request.method,
    headers,
    redirect: 'follow',
  };

  // GET/HEAD 无请求体
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = request.body;
    init.duplex = 'half';
  }

  try {
    const upstream = await fetch(finalTarget, init);

    // 透传响应体（流式）与关键头
    const outHeaders = new Headers();
    for (const key of ['content-type', 'content-length', 'cache-control', 'etag', 'last-modified']) {
      const v = upstream.headers.get(key);
      if (v) outHeaders.set(key, v);
    }

    return new Response(upstream.body, { status: upstream.status, headers: outHeaders });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: 'proxy_failed', detail: e && e.message ? e.message : String(e) }),
      { status: 502, headers: { 'content-type': 'application/json; charset=utf-8' } },
    );
  }
}
