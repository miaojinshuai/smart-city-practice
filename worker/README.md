# Cloudflare Worker 版 Mock API

支持 **GET / POST / PUT / DELETE**，与本地 `server.mjs` 共用同一份数据（`../mock/data.mjs`）。

## 线上地址

| 用途 | 地址 |
| --- | --- |
| 主域名（推荐，Postman 直接用） | `https://qixingba.dpdns.org` |
| workers.dev 备用 | `https://smart-city-mock.857560481ma.workers.dev` |

- 代码：`worker/index.mjs`
- 配置：根目录 `wrangler.toml`
- 打包体积：131 KB（gzip 32 KB），免费版上限 3 MB

## 一、部署

### 方式 A：API Token（推荐，网络受限时唯一可行）

此方式走 `api.cloudflare.com`，不需要访问 `dash.cloudflare.com`。

1. 在能打开 Cloudflare 的网络下创建 Token：
   **My Profile → API Tokens → Create Token → 使用 "Edit Cloudflare Workers" 模板**，
   或自定义权限：`Account / Workers Scripts / Edit` + `Account / Account Settings / Read`。
2. 设置环境变量后部署：

```bash
cd practice-site
export CLOUDFLARE_API_TOKEN=你的token
npx wrangler deploy
```

PowerShell：

```powershell
$env:CLOUDFLARE_API_TOKEN="你的token"
npx wrangler deploy
```

### 方式 B：`wrangler login`

```bash
npx wrangler login
npx wrangler deploy
```

> 需要能访问 `https://dash.cloudflare.com`。若报 `UND_ERR_CONNECT_TIMEOUT`，说明该域名被代理/网络拦截，请改用方式 A。

### 方式 C：临时账号（无需登录，60 分钟内有效）

```bash
npx wrangler deploy --temporary
```

会得到一个 `https://<name>.<随机>.workers.dev` 地址和一条 `Claim URL`。
打开 Claim URL 可把该 Worker 认领到自己的账号（认领后长期有效）。

## 二、本地调试

```bash
npx wrangler dev          # http://localhost:8787
```

不装 wrangler 也能验证：直接用 Request/Response 调用 `worker/index.mjs`（见 `_work/worker-test.mjs`）。

## 三、数据持久性：D1（已支持）

`worker/index.mjs` 检测到 `env.DB` 绑定时自动切到 D1，未绑定时退回内存。

**表结构**（`worker/schema.sql`）：每个数据集一行，`v` 存 JSON 文本，粒度与 `mock/data.mjs` 的 key 一致。

```sql
CREATE TABLE kv (k TEXT PRIMARY KEY, v TEXT NOT NULL, updated_at TEXT);
```

**读写策略**

| 场景 | 行为 |
| --- | --- |
| 读接口 | **每次请求都查 D1**（`SELECT v FROM kv WHERE k = ?`，只查当前接口用到的数据集） |
| 写接口 | 改内存后回写该数据集（`INSERT ... ON CONFLICT DO UPDATE`），下一次读立刻是新值 |
| 在 D1 控制台改数据 | 立即生效，无需重启 Worker |
| 多实例 | 每次都读库，天然一致 |
| 无 D1 绑定 | 退回内置数据（内存态），行为同原 Node 版 |

**初始化 D1**

```bash
npx wrangler d1 create smart-city-mock           # 记下 database_id
# 把 database_id 写进 wrangler.toml 的 [[d1_databases]]
node worker/seed.mjs                             # 生成 worker/seed.sql
npx wrangler d1 execute smart-city-mock --remote --file worker/schema.sql
npx wrangler d1 execute smart-city-mock --remote --file worker/seed.sql
npx wrangler deploy
```

没有 D1 时的行为与原 Node 版一致（实例内存，回收即丢）。

## 四、让 App 指向 Worker

App 的 `js/config.js` 默认指向 GitHub Pages（只读）。切到 Worker：

```js
localStorage.setItem('API_SITE', 'https://你的worker.workers.dev'); location.reload();
```

恢复：

```js
localStorage.removeItem('API_SITE'); location.reload();
```

此时 `POST / PUT / DELETE` 全部可用，图片请求由 Worker 302 到静态站点（`ASSET_BASE`）。

## 五、接口自检

```bash
curl https://qixingba.dpdns.org/mock/health
# {"ok":true,"storage":"d1","endpoints":305,"datasets":145,...}

curl https://qixingba.dpdns.org/prod-api/api/rotation/list

curl -X POST -H "Content-Type: application/json" \
     -d '{"username":"test02","password":"123456"}' \
     https://qixingba.dpdns.org/prod-api/api/login

# 增删改
curl -X POST https://qixingba.dpdns.org/prod-api/api/park/car \
     -H "Content-Type: application/json" -d '{"plateNo":"辽B66666","type":"小型汽车"}'
curl -X PUT  https://qixingba.dpdns.org/prod-api/api/park/car/4 \
     -H "Content-Type: application/json" -d '{"plateNo":"辽B88888"}'
curl -X DELETE https://qixingba.dpdns.org/prod-api/api/park/car/4
```
