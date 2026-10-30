# 部署到 GitHub Pages

## 已部署

- 仓库：<https://github.com/miaojinshuai/smart-city-practice>
- 站点：<https://miaojinshuai.github.io/smart-city-practice/>
- 方式：`main` 分支 + `/docs` 目录（Settings → Pages → Deploy from a branch）

> 注：仓库更新后会自动重新发布，通常 1~3 分钟生效。

## 结论

**可以。** 但 GitHub Pages 只能托管静态文件，原项目的 `server.mjs`（Node Mock 服务）跑不起来。
为此项目内置了**静态 Mock 层**：把 305 个接口的响应预生成成 JSON，前端用 `fetch` 拦截器返回本地数据。
部署后接口文档、在线调试、参考实现全部照常可用，只是数据变成只读快照。

---

## 一、先构建静态产物

```bash
cd practice-site
node build-static.mjs
```

产物在 `practice-site/docs/`（约 9 MB）：

```
docs/
├── index.html            站点入口
├── demo.html             移动端参考实现
├── assets/               样式、脚本、静态 Mock 拦截器
├── data/                 接口清单 / 题库 / 图标清单
├── img/                  73 张业务配图
├── icons/                130 个图标素材
├── static-api/           306 个预生成接口 JSON + manifest.json
└── .nojekyll             关闭 Jekyll 处理
```

> 每次改动了接口数据或前端代码，重新执行一次 `node build-static.mjs` 即可。

---

## 二、方式 A：用 docs 目录发布（最简单，无需 CI）

1. 在 GitHub 新建仓库，把 `practice-site` 里的内容推到 `main` 分支：

   ```bash
   cd practice-site
   git init
   git add .
   git commit -m "feat: 智慧城市练习平台"
   git branch -M main
   git remote add origin https://github.com/<你的用户名>/<仓库名>.git
   git push -u origin main
   ```

2. 仓库 **Settings → Pages**
   - Source 选择 `Deploy from a branch`
   - Branch 选 `main`，目录选 **`/docs`**
   - 保存，等 1~2 分钟

3. 访问 `https://<你的用户名>.github.io/<仓库名>/`

---

## 三、方式 B：GitHub Actions 自动构建

仓库根目录放 `.github/workflows/pages.yml`（本项目已提供模板，注意路径按仓库实际结构调整）：

```yaml
name: Deploy practice site
on:
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - name: Build static site
        working-directory: practice-site
        run: node build-static.mjs
      - uses: actions/upload-pages-artifact@v3
        with:
          path: practice-site/docs

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

然后在 **Settings → Pages → Source** 选择 `GitHub Actions`。

---

## 四、用 Postman 直接调接口

Pages 没有后端，但 `docs/prod-api/` 里已经把每个 **GET** 接口按原路径落成了静态文件，
所以文档里的 URL 换个域名就能直接请求：

```
文档里  https://your-host/prod-api/api/rotation/list
线上    https://miaojinshuai.github.io/smart-city-practice/prod-api/api/rotation/list
```

返回体就是标准结构：

```json
{ "code": 200, "msg": "查询成功", "rows": [ ... ], "total": 6 }
```

**规则与限制**

| 项目 | 说明 |
| --- | --- |
| 支持方法 | 仅 `GET`。`POST / PUT / DELETE` 静态托管不支持（会 405），请用站点内「接口文档 → 在线调试」 |
| 查询参数 | 不生效（静态文件不解析 query）。固定返回第一页 10 条，`total` 是真实总数 |
| 详情接口 | `/{id}` 预生成了 id 1~6，如 `/prod-api/api/park/lot/1` |
| 路径冲突 | 有 3 个接口同时是别的接口的父路径（`/api/metro/line`、`/api/living/phone`、`/api/common/weather`），目录不能与文件同名，这三个用 `.json` 后缀：`/prod-api/api/metro/line.json` |
| 全量索引 | `GET /prod-api/index.json` 列出所有可请求的路径 |

> 重新生成：`npm run build`（先 `build:static` 再 `build:api`），然后提交 `docs/` 推送即可。

## 五、静态版能力对照

| 功能 | 本地 Node 版 | GitHub Pages 版 |
| --- | --- | --- |
| 工作台 / 接口文档 / 题库 / 图标库 / 速查 | ✅ | ✅ |
| 响应示例（255 个实时数据 + 50 个文档示例） | ✅ | ✅（构建时快照） |
| 在线调试 / 调试台 | ✅ 真实请求 | ✅ 返回预生成数据，按 pageNum/pageSize 分页、按同名字段过滤 |
| 参考实现（首页/新闻/停车/外卖/地铁/电影/我的） | ✅ | ✅ |
| 登录拿 token | ✅ | ✅ 固定返回测试账号 token |
| 新增/修改/删除后数据变化 | ✅ 内存生效 | ⚠️ 返回成功但不落库 |
| 请求任意未预置接口 | ✅ | ⚠️ 返回 `code: 404 静态演示模式` |

页面右上角的 Base 标识会自动切换：
- 本地：`http://localhost:10091/prod-api`
- 静态：`static-api（预生成）`

侧边栏状态也会显示「静态演示 · 305 接口」。

---

## 六、注意事项

1. **子路径已适配**：所有资源都使用相对路径，放在 `https://user.github.io/repo/` 这类子目录下也能正常加载。
2. **仓库体积**：`docs/` 约 9 MB（图片 7 MB + 静态接口 0.63 MB），远低于 Pages 的 1 GB 限制。
3. **图片版权**：`docs/img/` 里的 73 张图来自公开图片检索，仅建议用于本地/内部练习演示；对外公开时请替换为自有版权素材。
4. **更新数据**：改完 `mock/data.mjs` 后要重新 `node build-static.mjs`，否则线上仍是旧快照。
5. **不想暴露源码**：只把 `docs/` 目录推到仓库也能跑（`.nojekyll` 必须一起提交）。
