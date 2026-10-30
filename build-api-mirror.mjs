/**
 * 生成「按原路径可请求」的静态接口镜像
 *   static-api/E278.json  →  docs/prod-api/api/rotation/list
 *
 * 目的：GitHub Pages 没有后端，但把响应体按接口原路径落成静态文件后，
 *      Postman / 浏览器直接 GET 文档里的 URL 就能拿到 {code,msg,rows,total}。
 *
 * 限制：只对 GET 有效（静态托管不支持 POST 方法）；查询参数不生效，固定返回第一页。
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DOCS = path.join(ROOT, 'docs');
const API_DIR = path.join(DOCS, 'static-api');
const OUT = path.join(DOCS, 'prod-api');
const PAGE_SIZE = 10;

const manifest = JSON.parse(fs.readFileSync(path.join(API_DIR, 'manifest.json'), 'utf8'));

const writeJSON = (rel, obj) => {
  const p = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, JSON.stringify(obj, null, 2));
};

// 既是接口又有一级子接口的路径（如 /api/metro/line 与 /api/metro/line/{id}），
// 目录和文件不能同名，这类落成 .json 后缀
const getPatterns = manifest.filter((x) => x.method === 'GET').map((x) => x.pattern);
const CONFLICT = new Set(
  getPatterns.filter((p) => getPatterns.some((q) => q !== p && q.startsWith(p + '/')))
);
// 清掉上一轮可能落成文件的冲突路径
for (const p of CONFLICT) {
  const f = path.join(OUT, p.replace(/^\/prod-api\//, ''));
  try { if (fs.statSync(f).isFile()) fs.unlinkSync(f); } catch {}
}

let listN = 0, detailN = 0, objN = 0;
const index = [];

for (const e of manifest) {
  const data = JSON.parse(fs.readFileSync(path.join(DOCS, e.file), 'utf8'));
  const base = e.pattern.replace(/^\/prod-api\//, '');
  const rel = CONFLICT.has(e.pattern) ? base + '.json' : base;

  if (e.method !== 'GET') continue; // 静态托管不支持非 GET 方法

  if (data.kind === 'list') {
    const items = data.items || [];
    writeJSON(rel, {
      code: 200,
      msg: '查询成功',
      rows: items.slice(0, PAGE_SIZE),
      total: items.length,
    });
    listN++;
    index.push({ url: e.pattern, kind: 'list', total: items.length, ...(CONFLICT.has(e.pattern) ? { mirror: e.pattern + '.json' } : {}) });
  } else if (data.kind === 'detail') {
    let any = false;
    for (const id of Object.keys(data.byId || {})) {
      const body = data.byId[id];
      writeJSON(rel.replace(/\{[^}]+\}/g, id), body);
      any = true;
    }
    if (any) { detailN++; index.push({ url: e.pattern, kind: 'detail', ids: Object.keys(data.byId).length }); }
  } else {
    writeJSON(rel, data.resp || { code: 200, msg: '操作成功' });
    objN++;
    index.push({ url: e.pattern, kind: 'object', ...(CONFLICT.has(e.pattern) ? { mirror: e.pattern + '.json' } : {}) });
  }
}

// 方便查：接口路径 → 静态文件路径
writeJSON('index.json', {
  note: 'GET 接口按原路径可直接请求；POST/PUT/DELETE 在静态托管下不可用，请用站点内的「在线调试」。',
  base: 'https://miaojinshuai.github.io/smart-city-practice',
  count: index.length,
  apis: index,
});

const size = (dir) => {
  let s = 0;
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    s += f.isDirectory() ? size(p) : fs.statSync(p).size;
  }
  return s;
};
const countFiles = (dir) =>
  fs.readdirSync(dir, { withFileTypes: true }).reduce(
    (n, f) => n + (f.isDirectory() ? countFiles(path.join(dir, f.name)) : 1), 0);

console.log(`list ${listN} / detail ${detailN} / object ${objN}`);
console.log(`文件 ${countFiles(OUT)} 个，${(size(OUT) / 1024 / 1024).toFixed(2)} MB`);
