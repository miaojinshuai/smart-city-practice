# Cloudflare Worker 版 Mock API

支持 **GET / POST / PUT / DELETE**，与本地 `server.mjs` 共用同一份数据（`../mock/data.mjs`）。

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

## 三、数据持久性的边界（重要）

| 项目 | 说明 |
| --- | --- |
| 读接口 | 完全正常，305 个接口按文档结构返回 |
| 写接口 | **只在当前 Worker 实例内存中生效**，同一实例内的后续查询能看到（下单→查订单列表没问题） |
| 实例回收 | 一段时间无请求后实例会被回收，`POST` 进去的数据随之丢失，回到初始快照 |
| 多实例 | 高并发时 Cloudflare 可能开多个实例，A 实例写入的数据 B 实例看不到 |
| 想真持久 | 需要绑定 D1（SQL）或 KV：把 `db` 初始化逻辑改成读写存储，写操作落库 |

> 比赛练习场景（一个人调试、当场看结果）内存态够用；要做多人共享的环境才需要上 D1。

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
curl https://你的worker.workers.dev/mock/health
curl https://你的worker.workers.dev/prod-api/api/rotation/list
curl -X POST -H "Content-Type: application/json" \
     -d '{"username":"test02","password":"123456"}' \
     https://你的worker.workers.dev/prod-api/api/login
```
