import { useEffect, useMemo, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { fetchCategories, importArchive } from '../api';
import type { Category, ImportResponse } from '../types';

function toApiTime(value: string): string {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(
    d.getMinutes(),
  )}:${pad(d.getSeconds())}`;
}

export default function ContentEdit() {
  const [cats, setCats] = useState<Category[]>([]);
  const [catError, setCatError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<ImportResponse | null>(null);
  const [errMsg, setErrMsg] = useState('');

  // 表单状态
  const [id, setId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [keywords, setKeywords] = useState('');
  const [description, setDescription] = useState('');
  const [urlToken, setUrlToken] = useState('');
  const [logo, setLogo] = useState('');
  const [publishTime, setPublishTime] = useState('');
  const [tag, setTag] = useState('');
  const [draft, setDraft] = useState('false');
  const [cover, setCover] = useState('0');
  const [imageUrls, setImageUrls] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetchCategories(0);
        if (!alive) return;
        if (res.code === 0 && Array.isArray(res.data)) {
          setCats(res.data);
          const first = res.data.find((c) => c.parent_id === 0) ?? res.data[0];
          if (first) setCategoryId(String(first.id));
        } else {
          setCatError(res.msg || '获取分类失败');
        }
      } catch (e) {
        if (!alive) return;
        setCatError('请求失败：' + (e instanceof Error ? e.message : String(e)));
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const topOptions = useMemo(() => cats.filter((c) => c.parent_id === 0), [cats]);
  const subOptions = useMemo(() => cats.filter((c) => c.parent_id !== 0), [cats]);
  const options = [...topOptions, ...subOptions];

  const onFiles = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) setImageFiles(Array.from(e.target.files));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setResult(null);
    setErrMsg('');

    if (!title.trim()) return setErrMsg('标题为必填项');
    if (!content.trim()) return setErrMsg('内容为必填项');
    if (!categoryId) return setErrMsg('请选择分类');

    const images = imageUrls
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

    setSubmitting(true);
    try {
      const res = await importArchive({
        id: id.trim() || undefined,
        title: title.trim(),
        content: content.trim(),
        category_id: categoryId,
        keywords: keywords.trim() || undefined,
        description: description.trim() || undefined,
        url_token: urlToken.trim() || undefined,
        logo: logo.trim() || undefined,
        publish_time: toApiTime(publishTime) || undefined,
        tag: tag.trim() || undefined,
        draft,
        cover,
        images,
        imageFiles,
      });
      if (res.code === 200 || res.code === 0) {
        setResult(res);
      } else {
        setErrMsg(res.msg || `提交失败（code: ${res.code}）`);
      }
    } catch (e) {
      setErrMsg('请求失败：' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <h2>内容编辑</h2>
        <p>通过 /api/import/archive 接口发布或更新内容文档</p>
      </div>

      {catError && <div className="alert alert-warning">{catError}</div>}
      {errMsg && <div className="alert alert-error">{errMsg}</div>}

      <form onSubmit={submit}>
        <div className="card">
          <h3>基础信息</h3>
          <div className="form-grid">
            <div className="field">
              <label>文档 ID（选填，留空自动生成）</label>
              <input className="input" value={id} onChange={(e) => setId(e.target.value)} placeholder="如 123" />
            </div>
            <div className="field">
              <label>
                分类 <span className="muted">*</span>
              </label>
              <select className="select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                <option value="">请选择分类</option>
                {options.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.parent_id !== 0 ? '　└ ' : ''}
                    {c.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="field full">
              <label>
                标题 <span className="muted">*</span>
              </label>
              <input
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="请输入文档标题"
              />
            </div>

            <div className="field full">
              <label>
                内容 <span className="muted">*</span>
              </label>
              <textarea
                className="textarea"
                style={{ minHeight: 200 }}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="请输入文档正文内容"
              />
            </div>

            <div className="field">
              <label>关键词（选填）</label>
              <input className="input" value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </div>
            <div className="field">
              <label>URL 别名 url_token（选填，仅字母数字）</label>
              <input
                className="input"
                value={urlToken}
                onChange={(e) => setUrlToken(e.target.value)}
                placeholder="如 my-article-01"
              />
            </div>

            <div className="field full">
              <label>简介 description（选填）</label>
              <textarea className="textarea" style={{ minHeight: 70 }} value={description} onChange={(e) => setDescription(e.target.value)} />
            </div>

            <div className="field">
              <label>缩略图 logo（选填，图片地址）</label>
              <input className="input" value={logo} onChange={(e) => setLogo(e.target.value)} placeholder="https://.../logo.png" />
            </div>
            <div className="field">
              <label>标签 tag（选填，英文逗号分隔）</label>
              <input className="input" value={tag} onChange={(e) => setTag(e.target.value)} placeholder="aaa,bbb,ccc" />
            </div>
          </div>
        </div>

        <div className="card mt-16">
          <h3>发布设置</h3>
          <div className="form-grid">
            <div className="field">
              <label>发布时间（选填，留空为立即）</label>
              <input
                className="input"
                type="datetime-local"
                value={publishTime}
                onChange={(e) => setPublishTime(e.target.value)}
              />
              <div className="hint">接口格式：2006-01-02 15:04:05，未来时间将定时发布。</div>
            </div>
            <div className="field">
              <label>存入草稿 draft</label>
              <select className="select" value={draft} onChange={(e) => setDraft(e.target.value)}>
                <option value="false">否（直接发布）</option>
                <option value="true">是（存为草稿）</option>
              </select>
            </div>
            <div className="field">
              <label>重复覆盖 cover</label>
              <select className="select" value={cover} onChange={(e) => setCover(e.target.value)}>
                <option value="0">0 - 同名/同 ID 报错</option>
                <option value="1">1 - 覆盖为最新</option>
                <option value="2">2 - 不判断</option>
              </select>
              <div className="hint">如需更新已存在文档，填 1 并提供相同标题或 ID。</div>
            </div>
          </div>
        </div>

        <div className="card mt-16">
          <h3>组图 images（选填，最多 9 张）</h3>
          <div className="field">
            <label>图片地址（每行一个 URL）</label>
            <textarea
              className="textarea"
              style={{ minHeight: 90 }}
              value={imageUrls}
              onChange={(e) => setImageUrls(e.target.value)}
              placeholder={'https://example.com/a.jpg\nhttps://example.com/b.jpg'}
            />
          </div>
          <div className="field">
            <label>或选择本地图片（可多选，将作为文件上传）</label>
            <input className="input" type="file" accept="image/*" multiple onChange={onFiles} />
            {imageFiles.length > 0 && (
              <div className="hint">已选择 {imageFiles.length} 个文件：{imageFiles.map((f) => f.name).join('、')}</div>
            )}
          </div>
        </div>

        <div className="mt-20 flex gap-12">
          <button className="btn btn-primary" type="submit" disabled={submitting}>
            {submitting ? '提交中…' : '发布 / 保存'}
          </button>
          <button
            className="btn btn-ghost"
            type="button"
            onClick={() => {
              setTitle(''); setContent(''); setKeywords(''); setDescription('');
              setUrlToken(''); setLogo(''); setTag(''); setPublishTime('');
              setImageUrls(''); setImageFiles([]); setResult(null); setErrMsg('');
            }}
          >
            清空
          </button>
        </div>

        {result && (
          <div className="result-box">
            <div className="alert alert-success" style={{ marginBottom: 10 }}>
              {result.msg || '操作成功'}
            </div>
            {result.data?.url && (
              <div>
                文档地址：
                <a href={result.data.url} target="_blank" rel="noreferrer">
                  {result.data.url}
                </a>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
