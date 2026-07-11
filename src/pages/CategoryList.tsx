import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import { fetchCategories } from '../api';
import type { Category } from '../types';

interface TreeNode extends Category {
  depth: number;
  children: TreeNode[];
}

function buildTree(cats: Category[]): TreeNode[] {
  const map = new Map<number, TreeNode>();
  cats.forEach((c) => map.set(c.id, { ...c, depth: 0, children: [] }));
  const roots: TreeNode[] = [];
  cats.forEach((c) => {
    const node = map.get(c.id)!;
    const parent = c.parent_id ? map.get(c.parent_id) : undefined;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });
  const flat: TreeNode[] = [];
  const walk = (nodes: TreeNode[], depth: number) => {
    nodes.forEach((n) => {
      n.depth = depth;
      flat.push(n);
      walk(n.children, depth + 1);
    });
  };
  walk(roots, 0);
  return flat;
}

export default function CategoryList() {
  const [cats, setCats] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchCategories(0);
        if (!alive) return;
        if (res.code === 0 && Array.isArray(res.data)) {
          setCats(res.data);
        } else {
          setError(res.msg || '获取分类失败');
        }
      } catch (e) {
        if (!alive) return;
        setError('请求失败：' + (e instanceof Error ? e.message : String(e)));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const titleOf = (id: number) => cats.find((c) => c.id === id)?.title ?? '—';

  const filtered = useMemo(() => {
    if (!query.trim()) return cats;
    return cats.filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()));
  }, [cats, query]);

  const rows = useMemo(() => buildTree(filtered), [filtered]);

  if (loading) return <div className="loading">加载中…</div>;

  return (
    <div>
      <div className="page-head">
        <h2>分类管理</h2>
        <p>内容分类结构（基于 /api/import/categories 接口）</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="toolbar">
        <input
          className="input search"
          placeholder="搜索分类名称…"
          value={query}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setQuery(e.target.value)}
        />
        <span className="badge badge-soft">共 {rows.length} 项</span>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: 70 }}>ID</th>
              <th>分类名称</th>
              <th style={{ width: 160 }}>上级分类</th>
              <th style={{ width: 110 }}>层级</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted" style={{ textAlign: 'center', padding: 28 }}>
                  无匹配的分类
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{r.id}</td>
                  <td>
                    <span style={{ display: 'inline-block', width: r.depth * 20 }} />
                    {r.depth > 0 && <span className="muted">└ </span>}
                    {r.title}
                  </td>
                  <td>{r.parent_id === 0 ? '—（顶级）' : titleOf(r.parent_id)}</td>
                  <td>
                    <span className={`badge ${r.parent_id === 0 ? 'badge-primary' : 'badge-soft'}`}>
                      {r.parent_id === 0 ? '一级' : `二级`}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
