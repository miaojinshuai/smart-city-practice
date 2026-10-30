/**
 * 智慧城市 Mock API —— Cloudflare Workers 版本
 *
 * 与 practice-site/server.mjs 共用同一份数据（../mock/data.mjs），
 * 支持 GET / POST / PUT / DELETE，写操作在实例内存中生效。
 *
 * 部署：npx wrangler deploy
 * 本地：npx wrangler dev
 */
import { db as seedDB } from '../mock/data.mjs';
import endpoints from './endpoints.mjs';

/* ------------------------------------------------------------ 数据源
 * 绑定了 D1（env.DB）时：启动读一次性加载，写操作按「数据集」整体回写；
 * 没绑定时退化为进程内存（与原 Node 版行为一致）。
 */
let db = null;

function baseDB() {
  if (!db) db = structuredClone(seedDB);
  return db;
}

/** 读：每次都从 D1 取该数据集最新内容（无绑定时用内置数据） */
async function ensureKey(env, key) {
  const d = baseDB();
  if (!env || !env.DB || !key) return d[key];
  try {
    const row = await env.DB.prepare('SELECT v FROM kv WHERE k = ?').bind(key).first();
    if (row && row.v) d[key] = JSON.parse(row.v);
  } catch (e) {
    console.error('[d1] 读取失败', key, e.message);
  }
  return d[key];
}

/** 一次请求需要读哪些数据集 */
function neededKeys(p, method) {
  if (p === '/prod-api/api/login') return ['user'];
  if (p.startsWith('/prod-api/api/common/user')) return ['user'];
  if (p.startsWith('/prod-api/api/common/weather')) return ['weather'];
  if (p.includes('/system/dict/data/type/')) return ['dict'];
  if (p.includes('logistics_info/')) return ['logisticsInfo'];
  if (p.includes('takeout/order/create')) return ['takeout/product', 'takeout/seller', 'takeout/order'];
  if (p.includes('takeout/pay')) return ['takeout/order'];
  const k = resolveKey(p);
  return k ? [k] : [];
}

/** 把某个数据集整体写回 D1（数组级粒度，一次写一个 key） */
async function saveKey(env, key) {
  const d = baseDB();
  if (!env || !env.DB || !d[key]) return;
  try {
    await env.DB.prepare(
      'INSERT INTO kv (k, v, updated_at) VALUES (?, ?, ?) ' +
      'ON CONFLICT(k) DO UPDATE SET v = excluded.v, updated_at = excluded.updated_at'
    ).bind(key, JSON.stringify(d[key]), now()).run();
  } catch (e) {
    console.error('[d1] 写入失败', key, e.message);
  }
}

/* ------------------------------------------------------------ 基础工具 */
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS,PATCH',
  'Access-Control-Allow-Headers': '*',
  'Access-Control-Max-Age': '86400',
};

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...CORS_HEADERS,
    },
  });

const pad2 = (n) => String(n).padStart(2, '0');
const now = () => {
  const d = new Date(Date.now() + 8 * 3600 * 1000); // 固定 UTC+8
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())} ` +
    `${pad2(d.getUTCHours())}:${pad2(d.getUTCMinutes())}:${pad2(d.getUTCSeconds())}`;
};

async function parseBody(request) {
  try {
    const text = await request.text();
    if (!text) return {};
    try {
      return JSON.parse(text);
    } catch {
      return Object.fromEntries(new URLSearchParams(text).entries());
    }
  } catch {
    return {};
  }
}

/* ------------------------------------------------------------ 会话（实例内存） */
const tokens = new Map();
const sessions = {};

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
  allorder: 'allorder',
  weather: 'weather',
  'common/user': 'user',
  'common/user/getInfo': 'user',
  'common/balance': 'balance',
  'common/feedback': 'feedback',
  upload: null,
};

function resolveKey(p) {
  const s = p.replace(/^\/prod-api\/?/, '').replace(/^api\//, '');
  const segs = s.split('/').filter(Boolean);
  while (segs.length && (/^\d+$/.test(segs[segs.length - 1]) || segs[segs.length - 1].startsWith('{'))) segs.pop();
  if (segs.length && ['list', 'my-list', 'hot', 'recommend-list', 'top', 'near', 'check', 'grt', 'user'].includes(segs[segs.length - 1])) segs.pop();

  const tries = [];
  for (let i = segs.length; i > 0; i--) tries.push(segs.slice(0, i).join('/'));
  if (segs.length >= 2) tries.push(segs.slice(1).join('/'));

  for (const t of tries) {
    if (ALIAS[t] !== undefined) return ALIAS[t];
    if (seedDB[t]) return t;
    if (t.endsWith('s') && seedDB[t.slice(0, -1)]) return t.slice(0, -1);
  }
  const mod = segs[0];
  for (const t of tries) {
    const k = `${mod}/${t}`;
    if (seedDB[k]) return k;
  }
  return null;
}

function paginate(list, q) {
  const pageNum = Math.max(1, parseInt(q.pageNum || '1', 10) || 1);
  const pageSize = Math.min(200, Math.max(1, parseInt(q.pageSize || '10', 10) || 10));
  return { rows: list.slice((pageNum - 1) * pageSize, pageNum * pageSize), total: list.length };
}

function filterList(list, q) {
  const skip = new Set(['pageNum', 'pageSize', 'orderByColumn', 'isAsc', 'token', '_t']);
  let out = list;
  for (const [k, v] of Object.entries(q)) {
    if (skip.has(k) || v === '' || v == null) continue;
    if (!list.some((it) => k in it)) continue;
    out = out.filter((it) => {
      const val = it[k];
      if (val === undefined || val === null) return false;
      if (typeof val === 'string' && typeof v === 'string') {
        if (['title', 'name', 'parkName', 'keyword', 'searchValue'].includes(k)) return val.includes(v);
        return val === v;
      }
      return String(val) === String(v);
    });
  }
  return out;
}

/* ------------------------------------------------------------ API 分发 */
async function handleApi(request, url, env) {
  const p = url.pathname;
  baseDB(); // 保证 db 已初始化（登录等接口不依赖任何数据集）
  for (const k of neededKeys(p, request.method)) await ensureKey(env, k);
  const q = Object.fromEntries(url.searchParams.entries());
  const method = request.method;

  /* 认证 */
  if (p === '/prod-api/api/login' && method === 'POST') {
    const { username, password } = await parseBody(request);
    if (!username || !password) return json({ code: 500, msg: '用户名或密码不能为空' });
    if (password !== '123456' && sessions[username] !== password) return json({ code: 500, msg: '密码错误' });
    if (username !== 'test02' && !sessions[username]) {
      sessions[username] = password;
      db.user = { ...db.user, userId: 100 + Object.keys(sessions).length, userName: username, nickName: username };
    }
    const token = 'mock.' + crypto.randomUUID();
    tokens.set(token, db.user.userId);
    await saveKey(env, 'user');
    return json({ code: 200, msg: '操作成功', token });
  }
  if (p === '/prod-api/api/logout') return json({ code: 200, msg: '操作成功' });
  if (p === '/prod-api/api/register' && method === 'POST') {
    const b = await parseBody(request);
    sessions[b.userName] = b.password || '123456';
    return json({ code: 200, msg: '操作成功' });
  }

  /* 用户 */
  if (p === '/prod-api/api/common/user/getInfo') return json({ code: 200, msg: '操作成功', user: db.user });
  if (p === '/prod-api/api/common/user' && method === 'PUT') {
    const b = await parseBody(request);
    Object.assign(db.user, Object.fromEntries(Object.entries(b || {}).filter(([, v]) => v !== undefined)));
    await saveKey(env, 'user');
    return json({ code: 200, msg: '操作成功' });
  }
  if (p === '/prod-api/api/common/user/resetPwd' && method === 'PUT') {
    const b = await parseBody(request);
    if ((b || {}).oldPassword !== '123456') return json({ code: 500, msg: '原密码错误' });
    sessions[db.user.userName] = b.newPassword;
    return json({ code: 200, msg: '操作成功' });
  }

  /* 天气 / 定位 / 字典 */
  if (p === '/prod-api/api/common/weather' || p === '/prod-api/api/common/weather/today')
    return json({ code: 200, msg: '操作成功', data: db.weather });
  if (p === '/prod-api/api/common/gps/province')
    return json({ code: 200, msg: '操作成功', data: [{ id: 1, provinceName: '辽宁省' }] });
  if (p === '/prod-api/api/common/gps/city')
    return json({ code: 200, msg: '操作成功', data: [{ id: 1, cityName: '大连市', provinceName: '辽宁省' }] });
  if (p === '/prod-api/api/common/gps/area')
    return json({ code: 200, msg: '操作成功', data: [{ id: 1, areaName: '甘井子区' }, { id: 2, areaName: '沙河口区' }, { id: 3, areaName: '中山区' }, { id: 4, areaName: '西岗区' }] });
  if (p === '/prod-api/api/common/gps/location')
    return json({ code: 200, msg: '操作成功', data: [{ provinceName: '辽宁省', cityName: '大连市', name: '五一广场', longitude: '121.614682', latitude: '38.914003', address: '辽宁省大连市沙河口区五一广场' }] });
  if (p.startsWith('/prod-api/api/system/dict/data/type/') || p.startsWith('/prod-api/system/dict/data/type/')) {
    const type = p.split('/').pop();
    return json({ code: 200, msg: '操作成功', data: db.dict[type] || [] });
  }

  /* 上传 */
  if (p === '/prod-api/common/upload')
    return json({ code: 200, msg: '操作成功', fileName: 'upload.png', url: 'img/city1.jpg' });

  /* 物流轨迹 */
  if (/^\/prod-api\/api\/logistics-inquiry\/logistics_info\/[^/]+$/.test(p))
    return json({ code: 200, msg: '操作成功', data: db.logisticsInfo });

  /* 电影场次 */
  if (p === '/prod-api/api/movie/theatre/list4times') {
    const theatreId = Number(q.theaterId || 1);
    const list = db['movie/theatre/times'].filter((t) => t.theaterId === theatreId);
    return json({ code: 200, msg: '查询成功', rows: list, total: list.length });
  }

  /* 外卖下单 / 支付 */
  if (p === '/prod-api/api/takeout/order/create' && method === 'POST') {
    const b = await parseBody(request);
    const orderNo = '2026' + String(Date.now()).slice(-14);
    const items = (b.orderItemList || []).map((it, i) => {
      const prod = db['takeout/product'].find((x) => x.id === it.productId) || {};
      return {
        id: i + 1, orderNo, productId: it.productId, productName: prod.name || '菜品',
        productImage: prod.imgUrl || '', quantity: it.quantity, price: prod.price || 0,
      };
    });
    db['takeout/order'].unshift({
      id: db['takeout/order'].length + 1, orderNo, userId: 2, sellerId: b.sellerId || 1,
      sellerName: (db['takeout/seller'].find((s) => s.id === b.sellerId) || {}).name || '商家',
      amount: b.amount || items.reduce((s, x) => s + x.price * x.quantity, 0),
      orderStatus: '待付款', paymentType: '电子支付', createTime: now(),
      addressDetail: b.addressDetail || '大连理工大学教学楼 A3-118', receiverName: b.name || '王大卫',
      receiverPhone: b.phone || '13800000000', remark: b.remark || '', orderItemList: items,
    });
    await saveKey(env, 'takeout/order');
    return json({ code: 200, msg: '操作成功', orderNo });
  }
  if (p === '/prod-api/api/takeout/pay' && method === 'POST') {
    const b = await parseBody(request);
    const o = db['takeout/order'].find((x) => x.orderNo === (b || {}).orderNo);
    if (o) o.orderStatus = '待配送';
    await saveKey(env, 'takeout/order');
    return json({ code: 200, msg: '支付成功' });
  }

  /* 停车充值 */
  if (p === '/prod-api/api/park/recharge/pay' && method === 'POST') return json({ code: 200, msg: '充值成功' });

  /* 影票 */
  if (p === '/prod-api/api/movie/ticket' && method === 'POST') {
    const b = await parseBody(request);
    return json({ code: 200, msg: '操作成功', data: { id: 99, orderNo: '2026' + String(Date.now()).slice(-14), ...b } });
  }
  if (/^\/prod-api\/api\/movie\/ticket\/order\/pay\/[^/]+$/.test(p)) return json({ code: 200, msg: '支付成功' });

  /* 违章缴款 */
  if (/^\/prod-api\/api\/traffic\/illegal\/pay\/[^/]+$/.test(p)) return json({ code: 200, msg: '缴款成功' });

  /* 巴士 */
  if (p === '/prod-api/api/bus/order' && method === 'POST')
    return json({ code: 200, msg: '操作成功', orderNum: String(Date.now()).slice(-8) });
  if (p === '/prod-api/api/bus/pay' && method === 'POST') return json({ code: 200, msg: '支付成功' });

  /* 活动报名 */
  if (p === '/prod-api/api/activity/signup/check') return json({ code: 200, msg: '操作成功', data: false });
  if (p === '/prod-api/api/activity/signup' && method === 'POST') return json({ code: 200, msg: '报名成功' });

  /* 门诊预约 */
  if (p === '/prod-api/api/hospital/reservation' && method === 'POST') {
    const b = await parseBody(request);
    return json({ code: 200, msg: '预约成功', data: { id: 99, orderNo: String(Date.now()), status: '1', ...b } });
  }

  /* 法律咨询 */
  if (p === '/prod-api/api/lawyer-consultation/legal-advice' && method === 'POST') {
    const b = await parseBody(request);
    const id = db['lawyer-consultation/legal-advice'].length + 1;
    db['lawyer-consultation/legal-advice'].unshift({
      id, fromUserId: 2, fromUserName: 'test02', createTime: now(), score: 0, likeCount: 0, myLikeState: false, ...b,
    });
    await saveKey(env, 'lawyer-consultation/legal-advice');
    return json({ code: 200, msg: '提交成功', data: { id } });
  }

  /* 宠物问诊 */
  if (p === '/prod-api/api/pet-hospital/inquiry' && method === 'POST') {
    const b = await parseBody(request);
    return json({ code: 200, msg: '提交成功', data: { id: 99, ...b, createTime: now(), state: '1' } });
  }
  if (p === '/prod-api/api/pet-hospital/inquiry-message' && method === 'POST') {
    const b = await parseBody(request);
    return json({ code: 200, msg: '发送成功', data: { id: 99, ...b, createTime: now() } });
  }

  /* 通用：点赞 / 收藏 */
  if (/^(.*)\/like\/([^/]+)$/.test(p) && (method === 'POST' || method === 'PUT')) return json({ code: 200, msg: '操作成功' });
  if (/\/evaluate-like$/.test(p)) return json({ code: 200, msg: '操作成功' });
  if (p === '/prod-api/api/takeout/collect/check') return json({ code: 200, isCollect: false, msg: '操作成功' });
  if (p === '/prod-api/api/takeout/collect' && method === 'POST') return json({ code: 200, isCollect: true, msg: '已收藏' });

  /* 数据集驱动：列表 / 详情 / 增删改 */
  const key = resolveKey(p);
  const last = p.split('/').pop();
  const isIdPath = /^\d+$/.test(last) || /^[A-Z]{1,3}\d+$/.test(last);

  if (key && db[key] && !Array.isArray(db[key])) {
    return json({ code: 200, msg: '操作成功', data: db[key] });
  }

  if (key && Array.isArray(db[key])) {
    const ds = db[key];
    if (method === 'GET') {
      if (isIdPath) {
        const item = ds.find((x) => String(x.id) === last || String(x.infoNo) === last || String(x.orderNo) === last);
        if (!item) return json({ code: 404, msg: '未找到资源' });
        return json({ code: 200, msg: '操作成功', data: item });
      }
      const list = filterList(ds, q);
      const { rows, total } = paginate(list, q);
      return json({ code: 200, msg: '查询成功', rows, total });
    }
    if (method === 'POST') {
      const b = await parseBody(request);
      const id = (ds.reduce((m, x) => Math.max(m, Number(x.id) || 0), 0) || 0) + 1;
      const item = { id, createTime: now(), userId: 2, ...(b || {}) };
      ds.unshift(item);
      await saveKey(env, key);
      return json({ code: 200, msg: '操作成功', data: item });
    }
    if (method === 'PUT' || method === 'PATCH') {
      const b = await parseBody(request);
      const id = isIdPath ? last : (b || {}).id;
      const item = ds.find((x) => String(x.id) === String(id));
      if (item) Object.assign(item, b || {});
      await saveKey(env, key);
      return json({ code: 200, msg: '操作成功' });
    }
    if (method === 'DELETE') {
      const i = ds.findIndex((x) => String(x.id) === last);
      if (i >= 0) ds.splice(i, 1);
      await saveKey(env, key);
      return json({ code: 200, msg: '删除成功' });
    }
  }

  /* 兜底：文档里存在但无数据集的接口 */
  const ep = endpoints.find((e) => e.m === method && e.p === p.replace(/\/\d+$/, '/{id}'));
  if (ep) {
    if (method === 'GET')
      return json({ code: 200, msg: '查询成功', rows: [], total: 0, _mock: 'generic', _tip: '该接口返回空列表，可参考接口文档中的响应示例构造页面' });
    return json({ code: 200, msg: '操作成功' });
  }

  return json({ code: 404, msg: '接口不存在：' + method + ' ' + p, _tip: '请在接口文档中核对路径' }, 404);
}

/* ------------------------------------------------------------ 入口 */
const PAGE = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>智慧城市 Mock API</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0b1220;color:#dbe6f6;
font-family:system-ui,"Microsoft YaHei",sans-serif}main{max-width:640px;padding:32px;line-height:1.75}
h1{font-size:20px;margin:0 0 6px}p{color:#8fa3bf;font-size:13px;margin:6px 0}code{background:#152036;padding:2px 6px;
border-radius:4px;color:#7dd3fc;font-size:12px}a{color:#38bdf8}</style></head><body><main>
<h1>智慧城市 · Mock API</h1>
<p>支持 GET / POST / PUT / DELETE，数据与练习平台一致。</p>
<p>健康检查：<code>/mock/health</code></p>
<p>示例：<code>/prod-api/api/rotation/list</code></p>
<p>登录：<code>POST /prod-api/api/login</code> · 账号 <code>test02</code> / <code>123456</code></p>
<p>接口文档：<a href="https://miaojinshuai.github.io/smart-city-practice/#/api">smart-city-practice</a></p>
</main></body></html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS_HEADERS });

    if (url.pathname === '/mock/health') {
      return json({
        ok: true,
        runtime: 'cloudflare-worker',
        endpoints: endpoints.length,
        modules: [...new Set(endpoints.map((e) => e.module))].length,
        datasets: Object.keys(baseDB()).length,
        storage: env && env.DB ? 'd1' : 'memory',
        methods: ['GET', 'POST', 'PUT', 'DELETE'],
        time: now(),
      });
    }

    // 图片走静态站点，避免把二进制打进 Worker
    if (/^\/(img|icons|mock-assets)\//.test(url.pathname)) {
      const base = (env && env.ASSET_BASE) || 'https://miaojinshuai.github.io/smart-city-practice';
      return Response.redirect(base + url.pathname, 302);
    }

    if (url.pathname.startsWith('/prod-api/')) {
      try {
        return await handleApi(request, url, env);
      } catch (err) {
        return json({ code: 500, msg: '服务端异常：' + err.message }, 500);
      }
    }

    return new Response(PAGE, {
      headers: { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS },
    });
  },
};
