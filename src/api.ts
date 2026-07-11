import { getSession } from './session';
import type { CategoriesResponse, ImportResponse } from './types';

// 所有接口都走同源代理 /api-proxy（由 Cloudflare Pages Functions 或本地 Vite 中间件转发）。
// 这样浏览器只与本站点通信，不需要后端开启 CORS；目标域名与 token 由请求头携带，
// 由代理在服务端转发到真实接口。彻底规避浏览器跨域（Failed to fetch）问题。
const PROXY = '/api-proxy';

interface ProxyOpts {
  // 登录校验时无会话，可显式传入域名/token
  domain?: string;
  token?: string;
}

function proxyFetch(pathWithQuery: string, init: RequestInit, opts: ProxyOpts = {}): Promise<Response> {
  const s = getSession();
  const domain = (opts.domain ?? s?.domain ?? '').replace(/\/$/, '');
  const token = opts.token ?? s?.token ?? '';
  const headers = new Headers(init.headers);
  headers.set('x-target-domain', domain);
  headers.set('x-api-token', token);
  return fetch(`${PROXY}${pathWithQuery}`, { ...init, headers });
}

// 统一：成功返回 JSON，失败抛出带可读信息的错误。
async function proxyJson<T>(pathWithQuery: string, init: RequestInit, opts?: ProxyOpts): Promise<T> {
  let res: Response;
  try {
    res = await proxyFetch(pathWithQuery, init, opts);
  } catch (e) {
    // 浏览器层面网络错误（如站点自身不可达）
    throw new Error('网络请求失败：' + (e instanceof Error ? e.message : String(e)));
  }
  if (res.ok) return (await res.json()) as T;

  let detail = `${res.status} ${res.statusText}`;
  try {
    const j = await res.json();
    if (j && j.error === 'proxy_failed') {
      detail = `无法连接接口域名（代理转发失败：${(j.detail || '').slice(0, 200)}）。请确认域名正确且服务可访问。`;
    } else if (j && j.message) {
      detail = j.message;
    }
  } catch {
    /* 忽略非 JSON 错误体 */
  }
  throw new Error(detail);
}

/** 登录校验：用域名 + token 调用分类接口，返回 code===0 即视为有效。 */
export async function validateCredentials(domain: string, token: string): Promise<boolean> {
  const data = await proxyJson<CategoriesResponse>(
    `/api/import/categories?module_id=0`,
    { method: 'GET' },
    { domain, token },
  );
  // code 0 表示 token 有效；-1 表示 token 错误
  return data.code === 0;
}

export async function fetchCategories(moduleId = 0): Promise<CategoriesResponse> {
  return proxyJson<CategoriesResponse>(`/api/import/categories?module_id=${moduleId}`, { method: 'GET' });
}

export interface ImportParams {
  id?: string;
  title: string;
  content: string;
  category_id: string;
  keywords?: string;
  description?: string;
  url_token?: string;
  logo?: string;
  publish_time?: string;
  tag?: string;
  draft?: string; // 'true' | 'false'
  cover?: string; // '0' | '1' | '2'
  images: string[]; // 图片 URL 列表
  imageFiles: File[]; // 本地图片文件
}

export async function importArchive(params: ImportParams): Promise<ImportResponse> {
  const fd = new FormData();
  fd.append('title', params.title);
  fd.append('content', params.content);
  fd.append('category_id', params.category_id);
  if (params.id) fd.append('id', params.id);
  if (params.keywords) fd.append('keywords', params.keywords);
  if (params.description) fd.append('description', params.description);
  if (params.url_token) fd.append('url_token', params.url_token);
  if (params.logo) fd.append('logo', params.logo);
  if (params.publish_time) fd.append('publish_time', params.publish_time);
  if (params.tag) fd.append('tag', params.tag);
  if (params.draft) fd.append('draft', params.draft);
  if (params.cover) fd.append('cover', params.cover);
  params.images.forEach((url) => fd.append('images[]', url));
  params.imageFiles.forEach((file) => fd.append('images[]', file));

  return proxyJson<ImportResponse>(`/api/import/archive`, { method: 'POST', body: fd });
}
