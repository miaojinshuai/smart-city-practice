# 智慧城市 · 移动应用与开发赛项练习平台

**在线访问：<https://miaojinshuai.github.io/smart-city-practice/>**
（GitHub Pages 静态部署，接口数据为预生成快照，打开即用）

基于《智慧城市平台 Open API V3.0》(492 页) 构建的技能竞赛练习环境。
包含**接口文档浏览**、**在线调试**、**练习任务**、**移动端参考实现**与**图标素材库**，自带离线 Mock 服务，官方服务器不可用时也能完整练习。

---

## 两种运行方式

**① 本地开发版（可读可写，功能完整）**

```bash
cd practice-site
node server.mjs
```

打开 <http://localhost:10091>，Windows 下可直接双击 `启动.bat`。

**② Cloudflare Worker 版（支持 POST/PUT/DELETE，数据存 D1）**

线上地址：**<https://qixingba.dpdns.org>**（`/prod-api/...` 直接可用）

```bash
node worker/deploy.mjs     # 需 CLOUDFLARE_API_TOKEN，自动建库/灌数据/部署
```

305 个接口全方法可用，读写都走 D1。详见 **[worker/README.md](./worker/README.md)**。

**③ 纯静态版（GitHub Pages / 任意静态托管）**

```bash
node build-static.mjs     # 产物在 docs/
```

静态版会自动探测环境：没有 Node 服务时启用内置的 `static-mock.js`，
把 `/prod-api/*` 请求交给 `docs/static-api/` 里的预生成 JSON。
接口文档、在线调试、参考实现照常可用；所有 GET 接口还按原路径落成了静态文件，
可以直接用 Postman 请求（见 **[GH_PAGES.md](./GH_PAGES.md)**）。

> 运行本地服务需要 Node.js 18+（零依赖）；部署 Worker 需要 `wrangler`。

---

## 关于 Mock 服务

官方文档中的服务器 `http://124.93.196.45:10091` 目前已无法访问（返回 502），
因此本项目内置了一套**路径与响应结构完全对齐文档**的 Mock 服务：

| 项目 | 说明 |
| --- | --- |
| 地址 | `http://localhost:10091/prod-api` |
| 接口覆盖 | 文档中的 305 个接口全部可路由，其中 70+ 张业务数据表提供真实数据 |
| 响应示例 | 255 个接口为本地实时数据、50 个写操作接口为文档示例，**全部含中文内容与图片** |
| 测试账号 | `test02 / 123456` |
| 鉴权 | 返回真实格式 token；默认不强制校验（`MOCK_STRICT=1` 可开启） |
| 数据持久化 | 内存态，重启服务后恢复初始数据 |

已经把业务逻辑写实的部分：登录/注册/用户资料/改密、钱包、新闻与评论点赞、停车场、车辆、
地铁线路与乘车记录、外卖商家/菜品/购物车下单/支付、违章查询与缴款、活动报名、
生活缴费、电影选座购票、门诊预约、政务诉求、法律咨询、宠物问诊等。

其余接口返回符合文档结构的空列表并带 `_mock: "generic"` 标记，用于对照字段结构练习页面搭建。

想让自己的练习 App 连本地服务，把 Base URL 改成 `http://localhost:10091/prod-api` 即可
（服务已开启 CORS）。

---

## 站点功能

| 页面 | 作用 |
| --- | --- |
| **工作台** | 模块总览、推荐训练路径、快速登录拿 token |
| **接口文档** | 305 个接口按 22 个模块分组，支持搜索 / 方法筛选；含参数表、响应示例、**在线调试** |
| **在线调试** | 独立控制台，支持自定义请求头、请求体、请求历史 |
| **练习任务** | 18 个训练任务，含需求点、验收标准、涉及接口、易错点，进度存本地 |
| **参考实现** | 手机壳内可运行的 H5 示例（首页/新闻/停车场/外卖/地铁/电影/我的） |
| **图标素材** | 官方素材库 130 个图标，点击复制路径、双击下载 |
| **速查手册** | 鉴权、状态码、字典、广告跳转约定、常见坑、提交检查清单 |

---

## 目录结构

```
practice-site/
├── server.mjs              # HTTP 服务：静态资源 + Mock API + 占位图生成
├── build-static.mjs        # 静态站点构建（生成 docs/）
├── docs/                   # 静态产物（可直接发布到 GitHub Pages）
├── GH_PAGES.md             # 部署说明
├── .github/workflows/      # Pages 自动部署工作流
├── mock/
│   ├── data.mjs            # 22 个业务模块的种子数据
│   └── images.mjs          # 本地图片清单（自动生成）
├── public/
│   ├── index.html          # 站点外壳
│   ├── demo.html           # 移动端参考实现（可独立打开）
│   ├── assets/
│   │   ├── app.css
│   │   ├── app.js
│   │   ├── api-mode.js     # 运行模式探测（live / static）
│   │   ├── static-mock.js  # 静态模式下拦截 /prod-api 请求
│   │   └── favicon.svg
│   ├── data/
│   │   ├── endpoints.json  # 从 PDF 解析出的 305 个接口
│   │   ├── tasks.json      # 18 个练习任务
│   │   └── icons.json      # 图标清单
│   ├── img/                # 73 张业务配图（停车场/地铁/外卖/电影/医院…）
│   └── icons/              # 图标素材库（从压缩包解出，GBK 文件名已修正）
└── README.md
```

---

## 接口数据结构要点

- 列表：`{ code, msg, rows, total }`
- 详情 / 操作：`{ code, msg, data }`
- 登录：`{ code, msg, token }`
- 分页：`pageNum`（从 1 开始）、`pageSize`
- 鉴权头：`Authorization: <token>`（不加 Bearer）
- 字典：`GET /prod-api/api/system/dict/data/type/{dictType}` → `data[].dictLabel / dictValue`

---

## 已知限制

1. **文档解析**：`endpoints.json` 由 PDF 文本自动解析生成，个别接口的"请求参数"表因原文排版合并/缺失而不完整，响应示例缺失的接口会在页面显示通用结构。
2. **Mock 深度**：列表类接口支持按同名字段精确过滤与分页；复杂的组合查询（如经纬度附近排序）返回原顺序。
3. **图片资源**：文档原始图片地址（118.190.154.52:7777 等）已全部失效。现已替换为 **73 张本地图片**（`public/img/`，按 21 个业务分类存放，约 9 MB），
   由 Bing 图片检索获取并统一裁切压缩为 880×660 / JPEG q78，仅用于本地练习演示；垃圾分类等暂无合适素材的分类仍回退到
   `/mock-assets/cover.svg` 动态封面。若用于公开分发请自行替换为自有版权素材。
4. **参考实现**：只演示数据绑定与主要交互，不含竞赛要求的全部动效、异常态与权限校验，验收请以练习任务为准。
5. `图标素材库.zip` 内文件名为 GBK 编码，已统一转码后解出，中文名保持原样。

---

## 素材与文档来源

- 接口文档：`智慧城市平台Open API_V.3.0.pdf`（492 页，V3.0 / 2022.06）
- 图标素材：`图标素材库.zip`（131 个文件，130 个可用图标）
