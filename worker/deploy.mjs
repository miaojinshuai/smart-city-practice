/**
 * 一键部署：创建/复用 D1 → 初始化表与数据 → 部署 Worker
 *
 *   CLOUDFLARE_API_TOKEN=xxx node worker/deploy.mjs
 * 或把令牌写进项目根目录 .cf_token，然后 node worker/deploy.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const DB_NAME = process.env.DB_NAME || 'smart-city-mock';

// 令牌：环境变量优先，其次项目根 .cf_token
let token = process.env.CLOUDFLARE_API_TOKEN;
if (!token) {
  const f = path.join(ROOT, '.cf_token');
  if (fs.existsSync(f)) token = fs.readFileSync(f, 'utf8').trim();
}
if (!token) {
  console.error('✗ 缺少 CLOUDFLARE_API_TOKEN（或项目根目录 .cf_token）');
  process.exit(1);
}
const env = { ...process.env, CLOUDFLARE_API_TOKEN: token, CI: '1' };
const wr = (args, opts = {}) =>
  execFileSync('npx', ['--yes', 'wrangler@4', ...args], { cwd: ROOT, env, encoding: 'utf8', shell: true, ...opts });

const step = (m) => console.log('\n▶ ' + m);

/* 1. 找库 */
step('检查 D1 数据库');
let list = [];
try {
  const raw = wr(['d1', 'list', '--json']);
  const start = raw.indexOf('[');
  list = JSON.parse(raw.slice(start));
} catch (e) {
  console.log('  列表读取失败，尝试直接创建');
}
let db = list.find((d) => d.name === DB_NAME);
console.log('  已有数据库:', list.map((d) => d.name).join(', ') || '(无)');

if (!db) {
  step('创建 D1 数据库');
  const raw = wr(['d1', 'create', DB_NAME]);
  const m = raw.match(/"database_id"\s*:\s*"([^"]+)"/) || raw.match(/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})/);
  if (!m) { console.error(raw); throw new Error('解析 database_id 失败'); }
  db = { name: DB_NAME, uuid: m[1] };
  console.log('  ✓ 新建', db.uuid);
} else {
  console.log('  ✓ 复用', db.uuid);
}

/* 2. 写回 wrangler.toml */
step('写入 wrangler.toml 绑定');
const tomlPath = path.join(ROOT, 'wrangler.toml');
let toml = fs.readFileSync(tomlPath, 'utf8');
toml = toml.replace(/# -+ D1[\s\S]*$/, '').trimEnd();
toml += `

# ---------------------------------------------------------------- D1
[[d1_databases]]
binding = "DB"
database_name = "${DB_NAME}"
database_id = "${db.uuid}"
`;
fs.writeFileSync(tomlPath, toml);
console.log('  ✓ database_id =', db.uuid);

/* 3. 初始化表 + 数据 */
step('初始化表结构');
wr(['d1', 'execute', DB_NAME, '--remote', '--file', 'worker/schema.sql'], { stdio: 'inherit' });

step('导入初始数据');
execFileSync(process.execPath, ['worker/seed.mjs'], { cwd: ROOT, stdio: 'inherit' });
wr(['d1', 'execute', DB_NAME, '--remote', '--file', 'worker/seed.sql'], { stdio: 'inherit' });

/* 4. 部署 */
step('部署 Worker');
wr(['deploy'], { stdio: 'inherit' });

step('完成');
