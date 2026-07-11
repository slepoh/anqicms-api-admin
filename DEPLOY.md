# Cloudflare Pages 部署步骤（保姆级）

本后台是纯静态前端（React + Vite），构建产物放在 `dist/` 目录。
**无需配置任何环境变量 / 密钥**，部署后直接用「域名 + Token」登录即可。

---

## 方式一：连接 Git 仓库部署（推荐，最省事）

> 适合有 GitHub / GitLab 账号的情况，之后每次 `git push` 自动重新构建。

### 步骤 1：把代码推到 Git 仓库
```bash
# 在项目根目录（已含 package.json / src / vite.config.ts 等）
git init
git add .
git commit -m "init cms admin"
git remote add origin https://github.com/你的用户名/你的仓库名.git
git push -u origin main
```

### 步骤 2：在 Cloudflare 创建 Pages 项目
1. 登录 https://dash.cloudflare.com → 左侧 **Workers 和 Pages** → 右上角 **创建** → 选 **Pages**
2. 选择 **连接到 Git**
3. 授权并选中刚才的仓库
4. 配置构建设置（见下方「通用构建配置」）
5. 点击 **保存并部署**

### 步骤 3：填写构建配置
见下方「通用构建配置」一节。

---

## 方式二：本地构建 + 直接上传（无需 Git）

> 适合不想推代码到公开仓库的情况。

### 步骤 1：本地构建
```bash
npm install
npm run build      # 产物生成在 dist/
```

### 步骤 2：安装并登录 wrangler
```bash
npm install -g wrangler
npx wrangler login   # 浏览器授权登录 Cloudflare
```

### 步骤 3：直接上传 dist/
```bash
npx wrangler pages deploy dist --project-name=cms-admin
```
首次会创建项目，之后重复该命令即更新。

---

## 通用构建配置（两种方式都要填）

在 Cloudflare Pages 控制台 → 项目 → **设置 → 构建与部署** 中填写：

| 项目 | 值 |
| --- | --- |
| **构建命令 (Build command)** | `npm run build` |
| **输出目录 (Build output directory)** | `dist` |
| **构建系统版本 / Node** | 保持默认（或选 Node 22） |
| **根目录 (Root directory)** | 留空（默认仓库根目录） |

> 环境变量 / 密钥：**全部留空，无需填写任何东西。**

填好后点 **保存并部署**，等待构建完成（绿色 ✓ 即成功）。

---

## 步骤 4：访问与登录

1. 部署完成后，Cloudflare 会分配一个 `https://<项目名>.pages.dev` 域名
2. 打开该地址，进入**登录页**：
   - **账号** 一栏填你的「接口域名」，例如 `https://www.example.com`
   - **密码** 一栏填你的「接口 Token」
3. 点击登录 → 系统会拿「域名 + Token」调用 `/api/import/categories` 校验，返回 `code:0` 即通过
4. 登录成功后进入数据看板，即可管理分类、编辑内容

> 不同人用各自的「域名 + Token」登录，就能访问各自的系统 —— 平台本身零配置，天然支持多人 / 多系统共用。

---

## 可选：绑定自定义域名

1. 项目控制台 → **设置 → 自定义域**
2. 添加你的域名（如 `admin.example.com`）
3. 按提示在你的域名 DNS 处添加一条 CNAME 记录指向 `<项目名>.pages.dev`
4. Cloudflare 会自动签发 HTTPS 证书

---

## 注意事项（部署前务必确认）

1. **后端接口要开 CORS**
   你的后端 `/api/import/categories` 与 `/api/import/archive` 必须允许本后台域名的跨域请求（`Access-Control-Allow-Origin`）。否则浏览器会拦截调用。
2. **接口建议用 HTTPS**
   Cloudflare Pages 强制 HTTPS，若你的接口是 `http://`，浏览器会因「混合内容」拦截。请为后端启用 HTTPS（域名填 `https://...`）。
3. **Token 即凭证**
   Token 只保存在你当前浏览器的 localStorage，不会上传到任何第三方；但也意味着本机可查看，请勿在公共电脑勾选「记住」类选项（当前版本登录即会话，退出即清除）。

---

## 重新部署 / 更新

- **Git 方式**：`git commit` + `git push` 后自动触发新构建
- **上传方式**：重新 `npm run build` 后再次 `npx wrangler pages deploy dist`
- **控制台方式**：项目页 → **部署** → **重试 / 重新部署**

---

## 排查：部署后页面打不开 / 接口报错

| 现象 | 排查点 |
| --- | --- |
| 页面空白 | 控制台 Network 看 `dist` 资源是否 404；确认输出目录是 `dist` |
| 登录提示「校验失败」 | 域名是否带 `https://`、Token 是否正确、后端是否返回 `code:0` |
| 接口调用被 CORS 拦截 | 后端未配置 `Access-Control-Allow-Origin`，联系后端加白名单 |
| 接口混合内容被拦 | 后端域名必须是 `https://` |
