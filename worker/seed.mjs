/**
 * 生成 D1 初始化脚本
 *   node worker/seed.mjs            → worker/seed.sql
 *   npx wrangler d1 execute smart-city-mock --remote --file worker/seed.sql
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { db } from '../mock/data.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const esc = (s) => String(s).replace(/'/g, "''");

const lines = ['-- 自动生成：Mock 数据集初始快照', 'DELETE FROM kv;'];
for (const [k, v] of Object.entries(db)) {
  lines.push(
    `INSERT INTO kv (k, v, updated_at) VALUES ('${esc(k)}', '${esc(JSON.stringify(v))}', datetime('now'));`
  );
}
lines.push('');
fs.writeFileSync(path.join(ROOT, 'seed.sql'), lines.join('\n'));
console.log(`数据集 ${Object.keys(db).length} 个 → worker/seed.sql (${(lines.join('\n').length / 1024).toFixed(0)} KB)`);
