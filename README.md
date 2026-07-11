# 内容管理后台（CMS Admin）

一个用于管理内容文档的后台管理系统，基于 **React + Vite + TypeScript** 构建，可一键部署到 **Cloudflare Pages**。

系统对接两个后端接口：

| 功能 | 接口 | 方法 |
| --- | --- | --- |
| 获取分类 | `/api/import/categories` | GET / POST |
| 导入 / 编辑文档 | `/api/import/archive` | POST (form-data) |

## 功能模块

- **登录页**：账号填「接口域名」、密码填「接口 Token」，登录时用 Token 调用分类接口做真实校验，localStorage 会话，路由守卫。支持多账号 / 多系统。
- **数据看板**：分类统计卡片、接口健康状态、分类分布图、快捷入口。
- **分类管理**：树形分类列表（基于 `parent_id`），支持按名称搜索。
- **内容编辑**：完整的文档表单（标题、内容、分类、关键词、简介、URL 别名、缩略图、标签、发布时间、草稿、覆盖策略、组图），提交到导入接口。
- **响应式布局**：桌面端侧边栏导航，移动端折叠为抽屉式菜单。

## 在 Cloudflare Pages 部署

### 1. 构建设置

在 Cloudflare Pages 创建项目（连接 Git 仓库或直接使用 `wrangler` 上传），构建配置如下：

- **构建命令（Build command）**：`npm run build`
- **输出目录（Build output directory）**：`dist`
- **Node 版本**：22（Pages 默认即可）

### 2. 无需配置环境变量

本平台的**域名与 Token 不再写死到任何变量中**。登录时由用户自行输入：

- **账号** = 接口域名（如 `https://www.example.com`）
- **密码** = 接口 Token

登录时会用「域名 + Token」调用 `/api/import/categories` 做真实校验，校验通过即视为登录成功。
因此 Cloudflare Pages 的「环境变量 / 密钥」**无需填写任何内容**，任何拿到平台地址的人都能用自己的域名 + Token 登录使用——天然支持多人、多系统共用。

### 3. 部署

推送代码或在控制台触发构建，完成后通过分配的 `*.pages.dev` 域名访问，输入你的域名与 Token 即可登录。

## 本地开发

```bash
npm install
npm run dev        # 本地开发预览（直接打开页面，登录时填入域名+Token）
npm run build      # 生产构建，产物在 dist/
npm run preview    # 预览构建产物
```

## 接口说明（对接要点）

### 获取分类 `GET /api/import/categories`
- Query / form 参数：`module_id`（必填，0=全部）
- 返回：`{ code: 0, data: [{ id, parent_id, title }] }`

### 导入 / 编辑文档 `POST /api/import/archive`（form-data）
- 必填：`title`、`content`、`category_id`
- 选填：`id`、`keywords`、`description`、`url_token`、`logo`、`publish_time`、`tag`、`draft`(true/false)、`cover`(0/1/2)、`images[]`（最多 9 张）
- 返回：`{ code: 200, msg: "发布成功", data: { url } }`

更新已存在文档：保持相同 `title` 或 `id`，并将 `cover` 设为 `1`。

## 同源代理（已内置，无需后端开 CORS）

本后台已内置 **Cloudflare Pages Functions 同源代理**：浏览器只请求本站下的 `/api-proxy/*`，
由 `functions/api-proxy/[...path].js` 在服务端把请求转发到你在登录时填写的接口域名。
因为浏览器全程只与本站同源通信，**后端接口无需开启 CORS**，彻底规避登录/调用时的
`Failed to fetch`（跨域拦截）问题。

- 目标域名与 Token 通过请求头 `x-target-domain` / `x-api-token` 传给代理；代理在服务端注入 `?token=` 后转发。
- 本地 `npm run dev` / `npm run preview` 也已通过 Vite 中间件实现同样的代理，开发与线上行为一致。
- 若填入的域名无法连通，会返回明确的「无法连接接口域名」提示，而非笼统的 CORS 报错。

## 注意事项

1. **无需 CORS**：得益于同源代理，后端接口不必配置 `Access-Control-Allow-Origin`。
2. **HTTPS**：Cloudflare Pages 强制 HTTPS；填入的接口域名建议用 `https://`，代理会自动补全缺失的协议头。
3. **登录即鉴权**：登录时用「域名 + Token」经代理调用分类接口校验，校验通过才放行，Token 即身份凭证。Token 仅保存在本浏览器 localStorage，不会上传到第三方。
4. **多系统共用**：不同用户用各自的域名 + Token 登录即可访问各自系统，平台本身无需任何配置。

## 进阶：进一步增强（可选）

当前代理仍把 Token 经请求头发往本站函数（同源、HTTPS，第三方域名看不到）。若你希望对 Token 做更严格保护，
可在 `functions/api-proxy/[...path].js` 中改为从 Pages 环境变量读取固定 Token，或增加签名校验——按需扩展即可。
