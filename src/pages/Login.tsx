import { useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { setSession } from '../session';
import { validateCredentials } from '../api';

export default function Login() {
  const [domain, setDomain] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const d = domain.trim();
    const t = token.trim();
    if (!d) return setError('请填写接口域名');
    if (!t) return setError('请填写接口 Token');

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
        tip = '请确认域名填写正确（含 http:// 或 https://）、服务可访问，且后端接口正常。';
      } else if (msg.includes('网络请求失败')) {
        tip = '无法连接到本站点，请刷新页面后重试。';
      } else if (/40[13]/.test(msg) || msg.includes('401') || msg.includes('403')) {
        tip = '可能是 Token 无效或域名对应账号无权限，请检查 Token。';
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
      <div className="login-card">
        <div className="login-logo">C</div>
        <h1>内容管理后台</h1>
        <p className="sub">输入你的接口域名与 Token 登录（支持多账号 / 多系统）</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label>接口域名（账号）</label>
            <input
              className="input"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="https://www.example.com"
              autoFocus
            />
          </div>
          <div className="field">
            <label>接口 Token（密码）</label>
            <input
              className="input"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="请输入接口 Token"
            />
          </div>
          <button className="btn btn-primary btn-block" type="submit" disabled={checking}>
            {checking ? '校验中…' : '登 录'}
          </button>
        </form>

        <div className="hint" style={{ marginTop: 14, lineHeight: 1.7 }}>
          登录时会通过同源代理调用 <code>/api/import/categories</code> 校验有效性，
          校验通过即视为登录成功。由于请求经本站代理转发，<b>无需后端开启 CORS</b>。
          域名与 Token 仅保存在本浏览器，不会上传到任何第三方。
        </div>
      </div>
    </div>
  );
}
