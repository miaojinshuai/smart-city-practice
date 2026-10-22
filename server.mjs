import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { db } from './mock/data.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(__dirname, 'public');
const PORT = Number(process.env.PORT || 10091);
const STRICT_AUTH = process.env.MOCK_STRICT === '1';

const endpoints = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data/endpoints.json'), 'utf8'));

/* ------------------------------------------------------------ 工具 */
const now = () => new Date().toLocaleString('sv-SE', { hour12: false }).replace('T', ' ');
const pad2 = (n) => String(n).padStart(2, '0');
const enc = encodeURIComponent;

const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf', '.zip': 'application/zip',
};

const tokens = new Map(); // token -> userId
const sessions = {};

function send(res, code, body, headers = {}) {
  const buf = Buffer.isBuffer(body) ? body : Buffer.from(String(body));
  res.writeHead(code, { 'Content-Length': buf.length, 'Access-Control-Allow-Origin': '*', ...headers });
  res.end(buf);
}
const json = (res, obj, code = 200) =>
  send(res, code, JSON.stringify(obj, null, 0), {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  });

/* ------------------------------------------------------------ 数据集解析 */
const ALIAS = {
  'press/press': 'press',
  'press/category': 'pressCategory',
  'press/comments': 'pressComment',
  'press/pressComment': 'pressComment',
  press: 'press',
  category: 'pressCategory',
  rotation: 'rotation',
  service: 'service',
  'service/list': 'service',
  'allorder': 'allorder',
  weather: 'weather',
  'common/user': 'user',
  'common/user/getInfo': 'user',
  'common/balance': 'balance',
  'common/feedback': 'feedback',
  upload: null,
};

function resolveKey(p) {
  let s = p.replace(/^\/prod-api\/?/, '').replace(/^api\//, '');
  let segs = s.split('/').filter(Boolean);
  while (segs.length && (/^\d+$/.test(segs[segs.length - 1]) || segs[segs.length - 1].startsWith('{')))
    segs.pop();
  if (segs.length && ['list', 'my-list', 'hot', 'recommend-list', 'top', 'near', 'check', 'grt', 'user'].includes(segs[segs.length - 1]))
    segs.pop();
  const tries = [];
  for (let i = segs.length; i > 0; i--) tries.push(segs.slice(0, i).join('/'));
  if (segs.length >= 2) tries.push(segs.slice(1).join('/'));
  for (const t of tries) {
    if (ALIAS[t] !== undefined) return ALIAS[t];
    if (db[t]) return t;
    if (t.endsWith('s') && db[t.slice(0, -1)]) return t.slice(0, -1);
  }
  // 模块级兜底
  const mod = segs[0];
  for (const t of tries) {
    const k = `${mod}/${t}`;
    if (db[k]) return k;
  }
  return null;
}

function paginate(list, q) {
  const pageNum = Math.max(1, parseInt(q.pageNum || '1', 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(q.pageSize || '10', 10) || 10));
  const total = list.length;
  return { rows: list.slice((pageNum - 1) * pageSize, pageNum * pageSize), total, pageNum, pageSize };
}

function filterList(list, q) {
  const skip = new Set(['pageNum', 'pageSize', 'orderByColumn', 'isAsc', 'token', '_t']);
  let out = list;
  for (const [k, v] of Object.entries(q)) {
    if (skip.has(k) || v === '' || v == null) continue;
    if (!list.some((it) => k in it)) continue; // 该字段不存在则忽略，避免误过滤
    const f = out.filter((it) => {
      const val = it[k];
      if (val === undefined || val === null) return false;
      if (typeof val === 'string' && typeof v === 'string') {
        if (k === 'title' || k === 'name' || k === 'parkName' || k === 'keyword' || k === 'searchValue')
          return val.includes(v);
        return val === v;
      }
      return String(val) === String(v);
    });
    out = f;
  }
  return out;
}

/* ------------------------------------------------------------ 模拟图片 */
function svgCover(t, i, w, h) {
  const palettes = [
    ['#0ea5e9', '#1e3a8a'], ['#22d3ee', '#0f766e'], ['#818cf8', '#3730a3'],
    ['#38bdf8', '#1e40af'], ['#34d399', '#065f46'], ['#fbbf24', '#b45309'],
    ['#f472b6', '#9d174d'], ['#a78bfa', '#4c1d95'],
  ];
  let hash = 0;
  for (const ch of t + i) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  const [c1, c2] = palettes[hash % palettes.length];
  const label = String(t).slice(0, 12);
  const r = Math.min(w, h);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient>
    <radialGradient id="r" cx="0.8" cy="0.15" r="0.8">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.35"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#g)"/>
  <rect width="${w}" height="${h}" fill="url(#r)"/>
  <g opacity="0.16" fill="none" stroke="#fff" stroke-width="1.2">
    <circle cx="${w * 0.78}" cy="${h * 0.22}" r="${r * 0.3}"/>
    <circle cx="${w * 0.16}" cy="${h * 0.86}" r="${r * 0.22}"/>
    <path d="M0 ${h * 0.72} L${w * 0.34} ${h * 0.48} L${w * 0.6} ${h * 0.66} L${w} ${h * 0.34}"/>
  </g>
  <text x="${w / 2}" y="${h / 2 + r * 0.06}" font-family="PingFang SC,Microsoft YaHei,sans-serif"
    font-size="${Math.round(r * 0.13)}" fill="#ffffff" fill-opacity="0.92" text-anchor="middle" font-weight="600">${label}</text>
</svg>`;
}

function svgAvatar(n) {
  let hash = 0;
  for (const ch of n) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  const hues = [190, 210, 260, 160, 30, 340];
  const hue = hues[hash % hues.length];
  const ch = String(n).slice(0, 1) || 'U';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
  <defs><linearGradient id="a" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0" stop-color="hsl(${hue},70%,58%)"/><stop offset="1" stop-color="hsl(${hue + 24},65%,38%)"/></linearGradient></defs>
  <rect width="160" height="160" rx="80" fill="url(#a)"/>
  <text x="80" y="104" font-family="PingFang SC,Microsoft YaHei,sans-serif" font-size="72" fill="#fff"
    text-anchor="middle" font-weight="600">${ch}</text></svg>`;
}

/* ------------------------------------------------------------ API 处理 */
function requireAuth(req) {
  if (!STRICT_AUTH) return true;
  const h = req.headers.authorization;
  return Boolean(h && tokens.has(h));
}

function handleApi(req, res, url) {
  const p = url.pathname;
  const q = Object.fromEntries(url.searchParams.entries());
  const method = req.method;

  /* ---- 认证 ---- */
  if (p === '/prod-api/api/login' && method === 'POST') {
    return readBody(req, (body) => {
      const { username, password } = body || {};
      if (!username || !password) return json(res, { code: 500, msg: '用户名或密码不能为空' });
      if (password !== '123456' && sessions[username] !== password)
        return json(res, { code: 500, msg: '密码错误' });
      if (username !== 'test02' && !sessions[username]) {
        sessions[username] = password;
        db.user = { ...db.user, userId: 100 + Object.keys(sessions).length, userName: username, nickName: username };
      }
      const token = 'mock.' + Buffer.from(JSON.stringify({ u: username, t: Date.now() })).toString('base64url');
      tokens.set(token, db.user.userId);
      json(res, { code: 200, msg: '操作成功', token });
    });
  }
  if (p === '/prod-api/api/logout') return json(res, { code: 200, msg: '操作成功' });
  if (p === '/prod-api/api/register' && method === 'POST')
    return readBody(req, (b) => {
      sessions[b.userName] = b.password || '123456';
      json(res, { code: 200, msg: '操作成功' });
    });

  /* ---- 用户 ---- */
  if (p === '/prod-api/api/common/user/getInfo') return json(res, { code: 200, msg: '操作成功', user: db.user });
  if (p === '/prod-api/api/common/user' && method === 'PUT')
    return readBody(req, (b) => {
      Object.assign(db.user, Object.fromEntries(Object.entries(b || {}).filter(([, v]) => v !== undefined)));
      json(res, { code: 200, msg: '操作成功' });
    });
  if (p === '/prod-api/api/common/user/resetPwd' && method === 'PUT')
    return readBody(req, (b) => {
      if ((b || {}).oldPassword !== '123456') return json(res, { code: 500, msg: '原密码错误' });
      sessions[db.user.userName] = b.newPassword;
      json(res, { code: 200, msg: '操作成功' });
    });

  /* ---- 天气 / 定位 / 字典 ---- */
  if (p === '/prod-api/api/common/weather' || p === '/prod-api/api/common/weather/today')
    return json(res, { code: 200, msg: '操作成功', data: db.weather });
  if (p === '/prod-api/api/common/gps/province')
    return json(res, { code: 200, msg: '操作成功', data: [{ id: 1, provinceName: '辽宁省' }] });
  if (p === '/prod-api/api/common/gps/city')
    return json(res, { code: 200, msg: '操作成功', data: [{ id: 1, cityName: '大连市', provinceName: '辽宁省' }] });
  if (p === '/prod-api/api/common/gps/area')
    return json(res, { code: 200, msg: '操作成功', data: [{ id: 1, areaName: '甘井子区' }, { id: 2, areaName: '沙河口区' }, { id: 3, areaName: '中山区' }, { id: 4, areaName: '西岗区' }] });
  if (p === '/prod-api/api/common/gps/location')
    return json(res, { code: 200, msg: '操作成功', data: [{ provinceName: '辽宁省', cityName: '大连市', name: '五一广场', longitude: '121.614682', latitude: '38.914003', address: '辽宁省大连市沙河口区五一广场' }] });
  if (p.startsWith('/prod-api/api/system/dict/data/type/') || p.startsWith('/prod-api/system/dict/data/type/')) {
    const type = p.split('/').pop();
    return json(res, { code: 200, msg: '操作成功', data: db.dict[type] || [] });
  }

  /* ---- 上传 ---- */
  if (p === '/prod-api/common/upload')
    return json(res, { code: 200, msg: '操作成功', fileName: 'upload.png', url: `/mock-assets/cover.svg?t=${enc('上传图片')}&i=9&w=600&h=400` });

  /* ---- 物流轨迹 ---- */
  if (/^\/prod-api\/api\/logistics-inquiry\/logistics_info\/[^/]+$/.test(p))
    return json(res, { code: 200, msg: '操作成功', data: db.logisticsInfo });

  /* ---- 电影场次/座位 ---- */
  if (p === '/prod-api/api/movie/theatre/list4times') {
    const theatreId = Number(q.theaterId || 1);
    const list = db['movie/theatre/times'].filter((t) => t.theaterId === theatreId);
    return json(res, { code: 200, msg: '查询成功', rows: list, total: list.length });
  }

  /* ---- 外卖：下单 / 支付 ---- */
  if (p === '/prod-api/api/takeout/order/create' && method === 'POST')
    return readBody(req, (b) => {
      const orderNo = '2026' + String(Date.now()).slice(-14);
      const items = (b.orderItemList || []).map((it, i) => {
        const prod = db['takeout/product'].find((x) => x.id === it.productId) || {};
        return { id: i + 1, orderNo, productId: it.productId, productName: prod.name || '菜品', productImage: prod.imgUrl || '', quantity: it.quantity, price: prod.price || 0 };
      });
      db['takeout/order'].unshift({
        id: db['takeout/order'].length + 1, orderNo, userId: 2, sellerId: b.sellerId || 1,
        sellerName: (db['takeout/seller'].find((s) => s.id === b.sellerId) || {}).name || '商家',
        amount: b.amount || items.reduce((s, x) => s + x.price * x.quantity, 0),
        orderStatus: '待付款', paymentType: '电子支付', createTime: now(),
        addressDetail: b.addressDetail || '大连理工大学教学楼 A3-118', receiverName: b.name || '王大卫',
        receiverPhone: b.phone || '13800000000', remark: b.remark || '', orderItemList: items,
      });
      json(res, { code: 200, msg: '操作成功', orderNo });
    });
  if (p === '/prod-api/api/takeout/pay' && method === 'POST')
    return readBody(req, (b) => {
      const o = db['takeout/order'].find((x) => x.orderNo === (b || {}).orderNo);
      if (o) o.orderStatus = '待配送';
      json(res, { code: 200, msg: '支付成功' });
    });

  /* ---- 停车缴费 / 充值 ---- */
  if (p === '/prod-api/api/park/recharge/pay' && method === 'POST')
    return readBody(req, () => json(res, { code: 200, msg: '充值成功' }));

  /* ---- 影票下单 / 支付 ---- */
  if (p === '/prod-api/api/movie/ticket' && method === 'POST')
    return readBody(req, (b) => json(res, { code: 200, msg: '操作成功', data: { id: 99, orderNo: '2026' + String(Date.now()).slice(-14), ...b } }));
  if (/^\/prod-api\/api\/movie\/ticket\/order\/pay\/[^/]+$/.test(p))
    return json(res, { code: 200, msg: '支付成功' });

  /* ---- 违章缴款 ---- */
  if (/^\/prod-api\/api\/traffic\/illegal\/pay\/[^/]+$/.test(p))
    return json(res, { code: 200, msg: '缴款成功' });

  /* ---- 巴士下单 ---- */
  if (p === '/prod-api/api/bus/order' && method === 'POST')
    return readBody(req, () => json(res, { code: 200, msg: '操作成功', orderNum: String(Date.now()).slice(-8) }));
  if (p === '/prod-api/api/bus/pay' && method === 'POST')
    return readBody(req, () => json(res, { code: 200, msg: '支付成功' }));

  /* ---- 活动报名 ---- */
  if (p === '/prod-api/api/activity/signup/check')
    return json(res, { code: 200, msg: '操作成功', data: false });
  if (p === '/prod-api/api/activity/signup' && method === 'POST')
    return readBody(req, () => json(res, { code: 200, msg: '报名成功' }));

  /* ---- 门诊预约 ---- */
  if (p === '/prod-api/api/hospital/reservation' && method === 'POST')
    return readBody(req, (b) => json(res, { code: 200, msg: '预约成功', data: { id: 99, orderNo: String(Date.now()), status: '1', ...b } }));

  /* ---- 法律咨询 ---- */
  if (p === '/prod-api/api/lawyer-consultation/legal-advice' && method === 'POST')
    return readBody(req, (b) => {
      const id = db['lawyer-consultation/legal-advice'].length + 1;
      db['lawyer-consultation/legal-advice'].unshift({ id, fromUserId: 2, fromUserName: 'test02', createTime: now(), score: 0, likeCount: 0, myLikeState: false, ...b });
      json(res, { code: 200, msg: '提交成功', data: { id } });
    });

  /* ---- 宠物问诊 ---- */
  if (p === '/prod-api/api/pet-hospital/inquiry' && method === 'POST')
    return readBody(req, (b) => json(res, { code: 200, msg: '提交成功', data: { id: 99, ...b, createTime: now(), state: '1' } }));
  if (p === '/prod-api/api/pet-hospital/inquiry-message' && method === 'POST')
    return readBody(req, (b) => json(res, { code: 200, msg: '发送成功', data: { id: 99, ...b, createTime: now() } }));

  /* ---- 通用：创建 / 收藏 / 点赞 / 评论 ---- */
  const likeMatch = p.match(/^(.*)\/like\/([^/]+)$/);
  if (likeMatch && (method === 'POST' || method === 'PUT')) return json(res, { code: 200, msg: '操作成功' });
  if (/\/evaluate-like$/.test(p)) return json(res, { code: 200, msg: '操作成功' });

  if (p === '/prod-api/api/takeout/collect/check') return json(res, { code: 200, isCollect: false, msg: '操作成功' });
  if (p === '/prod-api/api/takeout/collect' && method === 'POST')
    return readBody(req, () => json(res, { code: 200, isCollect: true, msg: '已收藏' }));

  /* ---- 列表 / 详情 / 增删改（数据集驱动） ---- */
  const key = resolveKey(p);
  const isIdPath = /\/[^/]+$/.test(p) && (() => {
    const last = p.split('/').pop();
    return /^\d+$/.test(last) || /^[A-Z]{1,3}\d+$/.test(last);
  })();

  if (key && db[key] && !Array.isArray(db[key])) {
    return json(res, { code: 200, msg: '操作成功', data: db[key] });
  }
  if (key && Array.isArray(db[key])) {
    const ds = db[key];
    if (method === 'GET') {
      if (isIdPath) {
        const id = p.split('/').pop();
        const item = ds.find((x) => String(x.id) === id || String(x.infoNo) === id || String(x.orderNo) === id);
        if (!item) return json(res, { code: 404, msg: '未找到资源' });
        return json(res, { code: 200, msg: '操作成功', data: item });
      }
      const list = filterList(ds, q);
      const { rows, total } = paginate(list, q);
      return json(res, { code: 200, msg: '查询成功', rows, total });
    }
    if (method === 'POST') {
      return readBody(req, (b) => {
        const id = (ds.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) || 0) + 1;
        const item = { id, createTime: now(), userId: 2, ...(b || {}) };
        ds.unshift(item);
        json(res, { code: 200, msg: '操作成功', data: item });
      });
    }
    if (method === 'PUT') {
      return readBody(req, (b) => {
        const id = isIdPath ? p.split('/').pop() : (b || {}).id;
        const item = ds.find((x) => String(x.id) === String(id));
        if (item) Object.assign(item, b || {});
        json(res, { code: 200, msg: '操作成功' });
      });
    }
    if (method === 'DELETE') {
      const id = p.split('/').pop();
      const i = ds.findIndex((x) => String(x.id) === String(id));
      if (i >= 0) ds.splice(i, 1);
      return json(res, { code: 200, msg: '删除成功' });
    }
  }

  /* ---- 兜底 ---- */
  const ep = endpoints.find((e) => e.method === method && e.path === p.replace(/\/\d+$/, '/{id}'));
  if (ep) {
    if (method === 'GET')
      return json(res, { code: 200, msg: '查询成功', rows: [], total: 0, _mock: 'generic', _tip: '该接口返回空列表，可参考接口文档中的响应示例构造页面' });
    return json(res, { code: 200, msg: '操作成功' });
  }
  json(res, { code: 404, msg: '接口不存在：' + method + ' ' + p, _tip: '请在接口文档中核对路径' }, 404);
}

function readBody(req, cb) {
  let raw = '';
  req.on('data', (c) => (raw += c));
  req.on('end', () => {
    let body = {};
    try {
      body = raw ? JSON.parse(raw) : {};
    } catch {
      body = Object.fromEntries(new URLSearchParams(raw).entries());
    }
    cb(body);
  });
}

/* ------------------------------------------------------------ 静态文件 */
function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (p === '/') p = '/index.html';
  if (p.startsWith('/mock-assets/')) {
    const q = Object.fromEntries(url.searchParams.entries());
    const w = Math.min(1600, Number(q.w) || 480);
    const h = Math.min(1600, Number(q.h) || 360);
    if (p === '/mock-assets/avatar.svg') return send(res, 200, svgAvatar(q.n || 'U'), { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public,max-age=3600' });
    return send(res, 200, svgCover(q.t || '智慧城市', q.i || '1', w, h), { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public,max-age=3600' });
  }
  const full = path.join(PUBLIC, p);
  if (!full.startsWith(PUBLIC)) return send(res, 403, 'Forbidden');
  fs.stat(full, (err, st) => {
    if (err || !st.isFile()) {
      if (!path.extname(p)) return serveFile(res, path.join(PUBLIC, 'index.html'));
      return send(res, 404, 'Not Found');
    }
    serveFile(res, full);
  });
}

function serveFile(res, full) {
  fs.readFile(full, (err, buf) => {
    if (err) return send(res, 404, 'Not Found');
    const ext = path.extname(full).toLowerCase();
    send(res, 200, buf, {
      'Content-Type': MIME[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public,max-age=60',
    });
  });
}

/* ------------------------------------------------------------ 启动 */
const server = http.createServer((req, res) => {
  try {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS')
    return send(res, 204, '', {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      'Access-Control-Allow-Headers': '*',
    });
  if (url.pathname === '/mock/health')
    return json(res, {
      ok: true, endpoints: endpoints.length, modules: [...new Set(endpoints.map((e) => e.module))].length,
      datasets: Object.keys(db).length, strictAuth: STRICT_AUTH, time: now(),
    });
  if (url.pathname.startsWith('/prod-api/')) return handleApi(req, res, url);
  serveStatic(req, res, url);
  } catch (err) {
    console.error('[handler]', req.method, req.url, err);
    if (!res.headersSent) json(res, { code: 500, msg: '服务端异常：' + err.message }, 500);
  }
});

server.listen(PORT, () => {
  console.log(`\n  智慧城市 · 移动应用开发练习平台`);
  console.log(`  站点      http://localhost:${PORT}/`);
  console.log(`  Mock API  http://localhost:${PORT}/prod-api/api/login`);
  console.log(`  接口总数  ${endpoints.length} / 数据集 ${Object.keys(db).length}\n`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    const alt = PORT + 1;
    console.log(`端口 ${PORT} 被占用，尝试 ${alt} ...`);
    server.listen(alt);
  } else throw e;
});
