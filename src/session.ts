// 运行时会话：域名与 token 由登录时输入，存储在浏览器 localStorage。
// 不再依赖任何构建期环境变量，从而实现多人 / 多系统共用同一平台。

const KEY = 'cms_session_v1';

export interface Session {
  domain: string;
  token: string;
}

let current: Session | null = load();

function load(): Session | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const obj = JSON.parse(raw) as Partial<Session>;
    if (obj && obj.domain && obj.token) {
      return { domain: obj.domain.replace(/\/$/, ''), token: obj.token };
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
  current = { domain: domain.replace(/\/$/, ''), token };
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
