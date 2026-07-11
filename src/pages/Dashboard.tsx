import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchCategories } from '../api';
import { getSession } from '../session';
import type { Category } from '../types';

type Health = 'ok' | 'fail' | 'unknown';

export default function Dashboard() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [health, setHealth] = useState<Health>('unknown');
  const navigate = useNavigate();
  const session = getSession();

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchCategories(0);
        if (!alive) return;
        if (res.code === 0 && Array.isArray(res.data)) {
          setCats(res.data);
          setHealth('ok');
        } else if (res.code === -1) {
          setHealth('fail');
          setError('Token 错误：' + res.msg);
        } else {
          setHealth('fail');
          setError(res.msg || '接口返回异常');
        }
      } catch (e) {
        if (!alive) return;
        setHealth('fail');
        setError('请求失败：' + (e instanceof Error ? e.message : String(e)));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const topLevel = useMemo(() => cats.filter((c) => c.parent_id === 0), [cats]);
  const total = cats.length;

  const dist = useMemo(() => {
    return topLevel
      .map((t) => ({
        title: t.title,
        count: cats.filter((c) => c.parent_id === t.id).length,
      }))
      .sort((a, b) => b.count - a.count);
  }, [topLevel, cats]);

  const maxCount = Math.max(1, ...dist.map((d) => d.count));

  const shortDomain = session ? session.domain.replace(/^https?:\/\//, '').replace(/\/$/, '') : '未配置';

  return (
    <div>
      <div className="page-head">
        <h2>数据看板</h2>
        <p>内容管理总览与接口状态</p>
      </div>

      {error && health === 'fail' && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">加载中…</div>
      ) : (
        <>
          <div className="grid grid-4">
            <div className="card stat">
              <div className="icon" style={{ background: 'var(--primary-soft)', color: 'var(--primary-dark)' }}>
                🗂️
              </div>
              <div className="label">一级分类</div>
              <div className="value">{topLevel.length}</div>
            </div>
            <div className="card stat">
              <div className="icon" style={{ background: 'var(--success-soft)', color: 'var(--success)' }}>
                📁
              </div>
              <div className="label">分类总数</div>
              <div className="value">{total}</div>
            </div>
            <div className="card stat">
              <div className="icon" style={{ background: '#e0e7ff', color: '#4338ca' }}>🌐</div>
              <div className="label">接口域名</div>
              <div className="value" style={{ fontSize: 15, wordBreak: 'break-all' }}>
                {shortDomain}
              </div>
            </div>
            <div className="card stat">
              <div
                className="icon"
                style={{
                  background: health === 'ok' ? 'var(--success-soft)' : 'var(--danger-soft)',
                  color: health === 'ok' ? 'var(--success)' : 'var(--danger)',
                }}
              >
                {health === 'ok' ? '✅' : '⚠️'}
              </div>
              <div className="label">接口状态</div>
              <div className="value" style={{ fontSize: 18 }}>
                {health === 'ok' ? '正常' : health === 'fail' ? '异常' : '未知'}
              </div>
            </div>
          </div>

          <div className="grid grid-2 mt-20">
            <div className="card">
              <h3>分类分布</h3>
              {dist.length === 0 ? (
                <p className="muted">暂无分类数据</p>
              ) : (
                dist.map((d) => (
                  <div className="bar-row" key={d.title}>
                    <span className="bar-label" title={d.title}>
                      {d.title}
                    </span>
                    <div className="bar-track">
                      <div className="bar-fill" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                    </div>
                    <span className="bar-value">{d.count}</span>
                  </div>
                ))
              )}
            </div>

            <div className="card">
              <h3>快捷操作</h3>
              <div className="flex flex-col gap-12" style={{ flexDirection: 'column' }}>
                <button className="btn btn-primary" onClick={() => navigate('/content')}>
                  ✏️ 新建 / 编辑内容
                </button>
                <button className="btn btn-ghost" onClick={() => navigate('/categories')}>
                  🗂️ 查看分类管理
                </button>
              </div>
              <div className="divider" />
              <p className="muted" style={{ fontSize: 13, lineHeight: 1.7 }}>
                本系统对接 <code>/api/import/archive</code> 与 <code>/api/import/categories</code> 接口，
                用于管理内容文档与其分类结构。域名与 Token 在登录时输入，仅保存在本浏览器。
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
