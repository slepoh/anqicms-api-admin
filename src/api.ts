import { getSession } from './session';
import type { CategoriesResponse, ImportResponse } from './types';

function buildUrl(path: string): string {
  const s = getSession();
  const base = s?.domain || '';
  const token = s?.token || '';
  const sep = path.includes('?') ? '&' : '?';
  return `${base}${path}${sep}token=${encodeURIComponent(token)}`;
}

/** 登录校验：用域名 + token 调用分类接口，返回 code===0 即视为有效。 */
export async function validateCredentials(domain: string, token: string): Promise<boolean> {
  const base = domain.replace(/\/$/, '');
  const url = `${base}/api/import/categories?module_id=0&token=${encodeURIComponent(token)}`;
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as CategoriesResponse;
  // code 0 表示 token 有效；-1 表示 token 错误
  return data.code === 0;
}

export async function fetchCategories(moduleId = 0): Promise<CategoriesResponse> {
  const url = buildUrl(`/api/import/categories?module_id=${moduleId}`);
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as CategoriesResponse;
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

  const url = buildUrl('/api/import/archive');
  const res = await fetch(url, { method: 'POST', body: fd });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as ImportResponse;
}
