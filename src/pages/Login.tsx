import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSession, normalizeDomain } from '../session';
import { validateCredentials } from '../api';

export default function Login() {
  const [domain, setDomain] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  // 只保留主机名部分，自动剥离用户手填的 http(s)://，统一由系统补全 https://
  const onDomainChange = (raw: string) => setDomain(raw.replace(/^https?:\/\//i, ''));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const raw = domain.trim();
    const t = token.trim();
    if (!raw) return setError('请填写接口域名');
    if (!t) return setError('请填写接口 Token');

    const d = normalizeDomain(raw);
    setChecking(true);
    try {
      const ok = await validateCredentials(d, t);
      if (ok) {
        setSession(d, t);
        navigate('/', { replace: true });
      } else {
        setError('校验失败：Token 错误或接口未返回有效数据（code 非 0）。');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      let tip = '';
      if (msg.includes('无法连接接口域名') || msg.includes('proxy_failed')) {
        tip = '请确认域名填写正确、服务可正常访问。';
      } else if (msg.includes('网络请求失败')) {
        tip = '无法连接到本站点，请刷新页面后重试。';
      } else if (/40[13]/.test(msg) || msg.includes('401') || msg.includes('403')) {
        tip = '可能是 Token 无效或账号无权限，请检查 Token。';
      } else {
        tip = '请确认域名正确、服务可访问。';
      }
      setError(msg + ' ' + tip);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="login-wrap">
      {/* 左侧品牌区 */}
      <aside className="login-aside">
        <div className="aside-inner">
          <div className="aside-brand">
            <span className="aside-logo">C</span>
            <span>内容管理后台</span>
          </div>
          <h2 className="aside-title">一处登录，管理你的每一套系统</h2>
          <p className="aside-desc">
            输入接口域名与 Token 即可接入，支持多人、多系统同时使用，无需任何后台配置。
          </p>
          <ul className="aside-feats">
            <li><span className="feat-ico">✓</span> 多域名 / 多 Token 自由切换</li>
            <li><span className="feat-ico">✓</span> 同源代理转发，无需后端开 CORS</li>
            <li><span className="feat-ico">✓</span> 数据看板 · 分类管理 · 内容编辑</li>
          </ul>
        </div>
        <div className="aside-deco aside-deco-1" />
        <div className="aside-deco aside-deco-2" />
      </aside>

      {/* 右侧表单区 */}
      <main className="login-main">
        <div className="login-card">
          <h1 className="form-title">欢迎登录</h1>
          <p className="form-sub">请填写你的接口域名与 Token</p>

          {error && (
            <div className="alert alert-error login-alert">
              <span className="alert-ico">!</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={submit}>
            <div className="field">
              <label>接口域名（账号）</label>
              <div className="input-affix">
                <span className="affix">https://</span>
                <input
                  className="input input-affixed"
                  value={domain}
                  onChange={(e) => onDomainChange(e.target.value)}
                  placeholder="www.example.com"
                  autoFocus
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
              <div className="hint">无需填写 http(s)://，系统默认按 https 访问</div>
            </div>

            <div className="field">
              <label>接口 Token（密码）</label>
              <input
                className="input"
                type="password"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="请输入接口 Token"
                autoComplete="off"
              />
            </div>

            <button className="btn btn-primary btn-block btn-login" type="submit" disabled={checking}>
              {checking ? (
                <span className="btn-spinner" aria-hidden />
              ) : null}
              {checking ? '校验中…' : '登 录'}
            </button>
          </form>

          <div className="login-foot">
            域名与 Token 仅保存在本浏览器，不会上传到任何第三方。
          </div>
        </div>
      </main>
    </div>
  );
}
