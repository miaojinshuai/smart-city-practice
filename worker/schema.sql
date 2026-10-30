-- D1 数据结构：每个「数据集」一行，v 是 JSON 文本
-- 粒度与 mock/data.mjs 的 key 一致（如 takeout/order、user、press）
CREATE TABLE IF NOT EXISTS kv (
  k          TEXT PRIMARY KEY,
  v          TEXT NOT NULL,
  updated_at TEXT
);
