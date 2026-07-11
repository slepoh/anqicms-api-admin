// 运行时会话：域名与 token 由登录时输入，存储在浏览器 localStorage。
// 不再依赖任何构建期环境变量，从而实现多人 / 多系统共用同一平台。

const KEY = 'cms_session_v1';

export interface Session {
  domain: string;
  token: string;
}

// 规范化接口域名：自动补全 https:// 前缀、去掉结尾斜杠。
// 用户登录时无需手动填写 http(s)://，系统默认按 https 访问。
export function normalizeDomain(input: string): string {
  let d = (input || '').trim();
  if (!d) return '';
  if (!/^https?:\/\//i.test(d)) d = 'https://' + d;
  return d.replace(/\/+$/, '');
}

let current: Session | null = load();

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<Session>;
    if (obj && obj.domain && obj.token) {
      return { domain: normalizeDomain(obj.domain), token: obj.token };
    }
    return null;
  } catch {
    return null;
  }
}

export function getSession(): Session | null {
  return current;
}

export function setSession(domain: string, token: string): void {
  current = { domain: normalizeDomain(domain), token };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* 忽略隐私模式等存储异常 */
  }
}

export function clearSession(): void {
  current = null;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* noop */
  }
}

export function isAuthed(): boolean {
  return current !== null;
}
