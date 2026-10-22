/**
 * 构建纯静态站点（用于 GitHub Pages / 任意静态托管）
 * 产物：practice-site/docs/
 *  - 复制 public/ 全部资源
 *  - 预生成 305 个接口的静态响应 → docs/static-api/
 *  - 生成 manifest.json 供前端 static-mock.js 匹配
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, 'public');
const DOCS = path.join(ROOT, 'docs');
const API_DIR = path.join(DOCS, 'static-api');
const PORT = 10099;
const BASE = `http://127.0.0.1:${PORT}`;

const endpoints = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data/endpoints.json'), 'utf8'));

/* ---------------- 启动临时 Mock 服务 ---------------- */
const server = spawn(process.execPath, [path.join(ROOT, 'server.mjs')], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: 'ignore',
});
const stop = () => { try { server.kill(); } catch {} };
process.on('exit', stop);

for (let i = 0; i < 50; i++) {
  try {
    const r = await fetch(`${BASE}/mock/health`);
    if (r.ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 200));
}

/* ---------------- 工具 ---------------- */
const hasId = (p) => /\{[^}]+\}/.test(p);
const fill = (p, id) => p.replace(/\{[^}]+\}/g, id);
const isListPath = (p) => /\/(list|search|near|my-list|hot\/list)$/.test(p);

async function call(ep, { id = 1, all = false, body } = {}) {
  let p = fill(ep.path, id);
  if (all) p += (p.includes('?') ? '&' : '?') + 'pageNum=1&pageSize=200';
  const opt = { method: ep.method, headers: { 'Content-Type': 'application/json' } };
  if (body) opt.body = JSON.stringify(body);
  else if (ep.method !== 'GET') opt.body = '{}';
  try {
    const r = await fetch(BASE + p, opt);
    return await r.json();
  } catch {
    return null;
  }
}

/* ---------------- 复制静态资源 ---------------- */
function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name);
    const d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

// 增量覆盖：不整目录删除，避免触发环境的批量删除保护
copyDir(PUBLIC, DOCS);
fs.mkdirSync(API_DIR, { recursive: true });
fs.writeFileSync(path.join(DOCS, '.nojekyll'), '');

/* ---------------- 逐个接口生成静态响应 ---------------- */
const manifest = [];
let okList = 0, okDetail = 0, okObj = 0, failed = 0;

for (const ep of endpoints) {
  const file = `static-api/${ep.id}.json`;
  let payload = null;
  let kind = 'object';

  if (ep.method === 'GET') {
    if (isListPath(ep.path)) {
      const body = await call(ep, { all: true });
      const rows = Array.isArray(body?.rows) ? body.rows : Array.isArray(body?.data) ? body.data : null;
      if (rows) {
        payload = { kind: 'list', items: rows };
        kind = 'list'; okList++;
      }
    } else if (hasId(ep.path)) {
      const byId = {};
      for (let id = 1; id <= 6; id++) {
        const b = await call(ep, { id });
        if (b && b.code === 200 && b.data) byId[id] = b;
      }
      if (Object.keys(byId).length) {
        payload = { kind: 'detail', byId };
        kind = 'detail'; okDetail++;
      }
    } else {
      const b = await call(ep);
      if (b) { payload = { kind: 'object', resp: b }; kind = 'object'; okObj++; }
    }
  } else {
    if (ep.path === '/prod-api/api/login') {
      const b = await call(ep, { body: { username: 'test02', password: '123456' } });
      payload = { kind: 'object', resp: b || ep.resp };
    } else {
      payload = { kind: 'object', resp: ep.resp || { code: 200, msg: '操作成功' } };
    }
    kind = 'object'; okObj++;
  }

  if (!payload) {
    payload = { kind: 'object', resp: ep.resp || { code: 200, msg: '操作成功', rows: [], total: 0 } };
    failed++;
  }

  fs.writeFileSync(path.join(DOCS, file), JSON.stringify(payload));
  manifest.push({ id: ep.id, method: ep.method, pattern: ep.path, file, kind });
}

fs.writeFileSync(path.join(API_DIR, 'manifest.json'), JSON.stringify(manifest));

/* ---------------- 统计 ---------------- */
let bytes = 0;
for (const f of fs.readdirSync(API_DIR)) bytes += fs.statSync(path.join(API_DIR, f)).size;

console.log(`接口静态化完成：list ${okList} / detail ${okDetail} / object ${okObj} / 回退 ${failed}`);
console.log(`static-api 文件数 ${fs.readdirSync(API_DIR).length}，体积 ${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`产物目录：${DOCS}`);
stop();
process.exit(0);
