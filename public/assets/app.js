/* 智慧城市 · 移动应用开发练习平台 */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const LS = {
  get(k, d) { try { return JSON.parse(localStorage.getItem('sc_' + k)) ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem('sc_' + k, JSON.stringify(v)); },
};

const state = {
  endpoints: [], tasks: [], icons: [],
  api: { q: '', mod: '全部', method: '全部', sel: null, tab: 'params', resp: null, sending: false },
  taskMod: '全部', taskLevel: '全部',
  debug: { method: 'GET', path: '/prod-api/api/common/user/getInfo', body: '', headers: '', resp: null, hist: LS.get('hist', []) },
  done: new Set(LS.get('tasks_done', [])),
  demoPage: 'home',
};

const MOD_ICON = {
  '通用接口': 'COM', '停哪儿': 'PARK', '城市地铁': 'MET', '外卖订餐': 'FOOD', '找工作': 'JOB',
  '找房子': 'HOUSE', '智慧交管': 'TRAF', '活动管理': 'ACT', '生活交费': 'LIFE', '看电影': 'MOV',
  '门诊预约': 'HOS', '智慧巴士': 'BUS', '政府服务热线': 'GOV', '法律咨询': 'LAW', '志愿活动': 'VOL',
  '数字图书馆': 'LIB', '垃圾分类宝典': 'GAR', '青年驿站': 'YOU', '爱心公益': 'WEL', '物流查询': 'LOG',
  '宠物医院': 'PET', '厨房助手': 'KIT',
};

/* ---------------------------------------------------------------- 工具 */
function toast(msg, type = '') {
  const d = document.createElement('div');
  d.className = 'toast ' + type;
  d.textContent = msg;
  $('#toast').appendChild(d);
  setTimeout(() => { d.style.opacity = '0'; d.style.transition = 'opacity .25s'; }, 2200);
  setTimeout(() => d.remove(), 2550);
}

function highlight(json) {
  return String(json)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, (m) => {
      let c = 'j-n';
      if (/^"/.test(m)) c = /:$/.test(m) ? 'j-k' : 'j-s';
      else if (/true|false/.test(m)) c = 'j-b';
      else if (/null/.test(m)) c = 'j-null';
      return `<span class="${c}">${m}</span>`;
    });
}

function copy(text, tip = '已复制') {
  navigator.clipboard?.writeText(text).then(() => toast(tip, 'ok')).catch(() => toast('复制失败', 'err'));
}

function levelTag(l) {
  const m = { '入门': 'ok', '进阶': 'cyan', '挑战': 'danger' };
  return `<span class="tag ${m[l] || ''}">${l}</span>`;
}

const AUTH_TOKEN = () => LS.get('token', '');

async function api(path, opt = {}) {
  const url = '/prod-api' + path;
  const headers = { ...(opt.headers || {}) };
  if (opt.body) headers['Content-Type'] = 'application/json';
  const tk = AUTH_TOKEN();
  if (tk) headers.Authorization = tk;
  const t0 = performance.now();
  const r = await fetch(url, { method: opt.method || 'GET', headers, body: opt.body ? JSON.stringify(opt.body) : undefined });
  const text = await r.text();
  const ms = Math.round(performance.now() - t0);
  let body;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: r.status, ms, size: text.length, body };
}

/* ---------------------------------------------------------------- 导航 */
const NAV = [
  { g: '开始', items: [{ k: 'overview', t: '工作台', i: 'M3 10.5 12 3l9 7.5M5 9.5V21h14V9.5' }] },
  {
    g: '练习', items: [
      { k: 'api', t: '接口文档', i: 'M4 4h16v16H4zM8 4v16M4 9h4', badge: '305' },
      { k: 'debug', t: '在线调试', i: 'M8 6 3 12l5 6M16 6l5 6-5 6M13 4l-2 16' },
      { k: 'tasks', t: '练习任务', i: 'M9 5h10M9 12h10M9 19h10M4 5l1.5 1.5L8 4M4 12l1.5 1.5L8 11M4 19l1.5 1.5L8 18', badge: '18' },
    ],
  },
  {
    g: '参考', items: [
      { k: 'demo', t: '参考实现', i: 'M7 2h10a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1zM11 19h2' },
      { k: 'icons', t: '图标素材', i: 'M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z' },
      { k: 'guide', t: '速查手册', i: 'M4 4h11l5 5v11H4zM15 4v5h5M8 13h8M8 17h5' },
    ],
  },
];

function renderNav() {
  $('#nav').innerHTML = NAV.map((g) => `
    <div class="nav-group">${g.g}</div>
    ${g.items.map((it) => `
      <div class="nav-item" data-k="${it.k}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="${it.i}"/></svg>
        <span>${it.t}</span>
        ${it.badge ? `<span class="badge-n">${it.badge}</span>` : ''}
      </div>`).join('')}
  `).join('');
  $$('.nav-item').forEach((el) => el.onclick = () => { location.hash = '#/' + el.dataset.k; });
}

const TITLES = {
  overview: ['工作台', '赛项训练总览'],
  api: ['接口文档', '305 个接口 · 22 个业务模块'],
  debug: ['在线调试', '直接向本地 Mock 服务发起请求'],
  tasks: ['练习任务', '按赛项考点拆分的 18 个训练任务'],
  demo: ['参考实现', '手机端可运行示例，对照学习'],
  icons: ['图标素材', '官方素材库 131 个图标'],
  guide: ['速查手册', '鉴权、分页、字典与常见坑'],
};

function route() {
  const k = (location.hash.replace('#/', '') || 'overview').split('?')[0];
  const view = TITLES[k] ? k : 'overview';
  $('#ptitle').textContent = TITLES[view][0];
  $('#psub').textContent = TITLES[view][1];
  $$('.nav-item').forEach((el) => el.classList.toggle('active', el.dataset.k === view));
  $('#view').scrollTop = 0;
  ({ overview: vOverview, api: vApi, tasks: vTasks, demo: vDemo, debug: vDebug, icons: vIcons, guide: vGuide })[view]();
}

/* ---------------------------------------------------------------- 概览 */
function vOverview() {
  const mods = [...new Set(state.endpoints.map((e) => e.module))];
  const doneN = state.done.size;
  $('#view').innerHTML = `
  <div class="view">
    <section class="hero">
      <h1>智慧城市 · 移动应用与开发赛项练习平台</h1>
      <p>基于《智慧城市平台 Open API V3.0》构建。内置 22 个业务模块、305 个接口与可离线运行的 Mock 服务，
         配套 18 个训练任务与一份可运行的移动端参考实现，帮助你把「看文档」变成「跑起来」。</p>
      <div class="chips">
        <span class="tag cyan">RESTful</span>
        <span class="tag cyan">JSON</span>
        <span class="tag cyan">Token 鉴权</span>
        <span class="tag cyan">分页 pageNum / pageSize</span>
        <span class="tag ok" id="modeTag">本地 Mock 已就绪</span>
      </div>
    </section>

    <div class="grid g4" style="margin-bottom:16px">
      <div class="card stat"><span class="v">${state.endpoints.length}</span><span class="k">接口总数</span><span class="d">22 个业务模块</span></div>
      <div class="card stat"><span class="v">${state.tasks.length}</span><span class="k">练习任务</span><span class="d">已完成 ${doneN} / ${state.tasks.length}</span></div>
      <div class="card stat"><span class="v">${state.icons.length}</span><span class="k">图标素材</span><span class="d">PNG / SVG</span></div>
      <div class="card stat"><span class="v">${mods.length}</span><span class="k">业务模块</span><span class="d">覆盖衣食住行</span></div>
    </div>

    <div class="card" style="margin-bottom:16px">
      <div class="card-h"><h3>模块入口</h3><span class="sub">点击查看该模块全部接口</span>
        <div class="right"><button class="btn sm ghost" id="allApi">查看全部接口 →</button></div></div>
      <div class="mod-grid">
        ${mods.map((m) => {
          const n = state.endpoints.filter((e) => e.module === m).length;
          return `<div class="mod-card" data-m="${esc(m)}"><div class="ico">${MOD_ICON[m] || 'API'}</div>
            <div><div class="nm">${esc(m)}</div><div class="ct">${n} 个接口</div></div></div>`;
        }).join('')}
      </div>
    </div>

    <div class="grid g2">
      <div class="card">
        <div class="card-h"><h3>三步开始</h3></div>
        <div class="demo-note">
          <p><b>1 · ${window.API_MODE === 'static' ? '无需启动服务' : '启动服务'}</b><br/>${window.API_MODE === 'static'
            ? '<span class="small muted">当前为静态部署，接口数据已预生成在 <span class="mono">static-api/</span></span>'
            : '<span class="mono small muted">node server.mjs</span> → <span class="mono small hl">http://localhost:10091</span>'}</p>
          <p><b>2 · 拿到 Token</b> 点击右上角「快速登录」，或用测试账号 <span class="mono">test02 / 123456</span> 调登录接口。</p>
          <p><b>3 · 开始练习</b> 在「练习任务」里按模块做题，遇到不确定的接口直接点进文档调试。</p>
        </div>
        <div class="code-inline" style="margin-top:12px">POST /prod-api/api/login
Content-Type: application/json

{ "username": "test02", "password": "123456" }</div>
      </div>
      <div class="card">
        <div class="card-h"><h3>推荐训练路径</h3></div>
        ${[
          ['基础：登录 + 首页 + 列表分页', ['T01', 'T02', 'T18'], 'ok'],
          ['进阶：详情 + 表单 + 状态流转', ['T03', 'T04', 'T09', 'T15'], 'cyan'],
          ['实战：订单全链路', ['T08', 'T10', 'T12'], 'danger'],
        ].map(([t, ids, c]) => `
          <div style="margin-bottom:14px">
            <div class="row" style="margin-bottom:7px"><span class="tag ${c}">${t}</span><span class="small muted">${ids.length} 个任务</span></div>
            <div class="chips">${ids.map((id) => {
              const task = state.tasks.find((x) => x.id === id);
              return `<span class="chip" data-task="${id}">${id} · ${esc(task ? task.title : '')}</span>`;
            }).join('')}</div>
          </div>`).join('')}
      </div>
    </div>
  </div>`;

  if (window.API_MODE === 'static') {
    const mt = $('#modeTag');
    if (mt) { mt.textContent = '静态演示数据'; }
    const sf = document.querySelector('.sidebar-foot div:last-child');
    if (sf) sf.textContent = '静态数据 · 可直接部署';
  }
  $('#allApi').onclick = () => { location.hash = '#/api'; };
  $$('.mod-card').forEach((el) => el.onclick = () => {
    state.api.mod = el.dataset.m; state.api.q = ''; state.api.sel = null; state.api.method = '全部';
    location.hash = '#/api';
  });
  $$('[data-task]').forEach((el) => el.onclick = () => openTask(el.dataset.task));
}

/* ---------------------------------------------------------------- 接口文档 */
const qs = (p) => (p.includes('?') ? p.split('?')[1].split('&') : []);

function apiFiltered() {
  const q = state.api.q.trim().toLowerCase();
  return state.endpoints.filter((e) => {
    if (state.api.mod !== '全部' && e.module !== state.api.mod) return false;
    if (state.api.method !== '全部' && e.method !== state.api.method) return false;
    if (!q) return true;
    return (e.path + ' ' + e.name + ' ' + (e.desc || '')).toLowerCase().includes(q);
  });
}

function vApi() {
  const mods = ['全部', ...new Set(state.endpoints.map((e) => e.module))];
  $('#view').innerHTML = `
  <div class="view">
    <div class="api-layout">
      <div class="api-panel">
        <div class="api-tools">
          <input class="input" id="apiQ" placeholder="搜索路径 / 接口名…" value="${esc(state.api.q)}" />
          <div class="row" style="gap:8px">
            <select class="select" id="apiMod">${mods.map((m) => `<option ${m === state.api.mod ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select>
            <select class="select" id="apiMethod" style="width:110px">${['全部', 'GET', 'POST', 'PUT', 'DELETE'].map((m) => `<option ${m === state.api.method ? 'selected' : ''}>${m}</option>`).join('')}</select>
          </div>
        </div>
        <div class="api-list" id="apiList"></div>
      </div>
      <div id="apiDetail"></div>
    </div>
  </div>`;

  const refresh = (resetSel) => {
    if (resetSel) { const f = apiFiltered(); state.api.sel = f[0]?.id; state.api.resp = null; state.api.tab = 'params'; }
    renderApiList(); renderApiDetail();
  };
  $('#apiQ').oninput = (e) => { state.api.q = e.target.value; refresh(true); };
  $('#apiMod').onchange = (e) => { state.api.mod = e.target.value; refresh(true); };
  $('#apiMethod').onchange = (e) => { state.api.method = e.target.value; refresh(true); };
  renderApiList();
  if (!state.api.sel) state.api.sel = (state.endpoints.find((e) => e.path === '/prod-api/api/login') || apiFiltered()[0])?.id;
  renderApiDetail();
}

function renderApiList() {
  const list = apiFiltered();
  if (!list.length) { $('#apiList').innerHTML = `<div class="empty">没有匹配的接口</div>`; return; }
  let html = '', cur = '';
  for (const e of list) {
    if (e.module !== cur) { cur = e.module; html += `<div class="api-group-h">${esc(cur)}</div>`; }
    html += `<div class="api-item ${state.api.sel === e.id ? 'active' : ''}" data-id="${e.id}">
      <span class="m ${e.method}">${e.method}</span>
      <div style="min-width:0"><div class="nm">${esc(e.name || e.path)}</div>
      <div class="pth">${esc(e.path.replace('/prod-api', ''))}</div></div></div>`;
  }
  $('#apiList').innerHTML = html;
  const act = $('#apiList .api-item.active');
  if (act) act.scrollIntoView({ block: 'nearest' });
  $$('#apiList .api-item').forEach((el) => el.onclick = () => {
    state.api.sel = el.dataset.id; state.api.resp = null; state.api.tab = 'params';
    renderApiList(); renderApiDetail();
  });
}

function epById(id) { return state.endpoints.find((e) => e.id === id); }

function renderApiDetail() {
  const e = epById(state.api.sel);
  const box = $('#apiDetail');
  if (!e) { box.innerHTML = `<div class="card empty">请选择一个接口</div>`; return; }
  const pathParams = [...new Set((e.path.match(/\{([^}]+)\}/g) || []))];
  const qKeys = e.queryKeys || [];
  const needAuth = /token/i.test(e.desc || '');
  const isList = /list|search|near/.test(e.path);

  box.innerHTML = `
  <div class="detail">
    <div class="detail-h">
      <div class="detail-title">
        <span class="m ${e.method}" style="font-size:12px;padding:3px 8px">${e.method}</span>
        <h2>${esc(e.name || e.path)}</h2>
        ${needAuth ? '<span class="tag warn">需 Token</span>' : '<span class="tag">公开</span>'}
        <span class="tag">${esc(e.module)}</span>
      </div>
      <div class="pathbar">
        <span class="u">https://your-host</span><span class="p">${esc(e.path)}</span>
        <span class="copy" id="cpPath">复制</span>
      </div>
      ${e.desc ? `<div class="muted small" style="margin-top:10px">${esc(e.desc)}</div>` : ''}
    </div>
    <div class="tabs">
      ${[['params', '请求参数'], ['resp', '响应示例'], ['try', '在线调试']].map(([k, t]) => `<div class="tab ${state.api.tab === k ? 'active' : ''}" data-tab="${k}">${t}</div>`).join('')}
    </div>
    <div class="detail-body" id="apiBody"></div>
  </div>`;

  $('#cpPath').onclick = () => copy(e.method + ' ' + e.path);
  $$('.tab').forEach((t) => t.onclick = () => { state.api.tab = t.dataset.tab; renderApiDetail(); });
  renderApiBody(e, pathParams, qKeys, isList);
}

function renderApiBody(e, pathParams, qKeys, isList) {
  const body = $('#apiBody');
  if (state.api.tab === 'params') {
    const rows = [];
    pathParams.forEach((p) => rows.push({ k: p, d: '路径参数', r: true, t: 'string', in: 'path' }));
    if (isList) {
      rows.push({ k: 'pageNum', d: '当前页码，从 1 开始', r: false, t: 'integer', in: 'query' });
      rows.push({ k: 'pageSize', d: '每页条数，建议 8 / 10', r: false, t: 'integer', in: 'query' });
    }
    qKeys.forEach((k) => rows.push({ k, d: '查询条件', r: false, t: 'string', in: 'query' }));
    (e.params || []).forEach((p) => rows.push({ k: p.name, d: p.desc, r: p.required, t: p.type, in: e.method === 'GET' ? 'query' : 'body' }));

    body.innerHTML = rows.length ? `
      <table class="tb"><thead><tr><th style="width:170px">参数名</th><th>说明</th><th style="width:90px">位置</th><th style="width:90px">类型</th><th style="width:70px">必填</th></tr></thead>
      <tbody>${rows.map((r) => `<tr><td class="k">${esc(r.k)}</td><td>${esc(r.d || '-')}</td>
        <td><span class="tag" style="font-size:10px">${r.in}</span></td><td class="t">${esc(r.t || '-')}</td>
        <td>${r.r ? '<span class="tag danger">是</span>' : '<span class="muted small">否</span>'}</td></tr>`).join('')}</tbody></table>
      ${e.method !== 'GET' ? `<div class="callout" style="margin-top:14px">请求体使用 <code>application/json</code>，不要漏掉 <code>Content-Type</code>。</div>` : ''}
    ` : `<div class="empty">该接口无请求参数</div>`;
    return;
  }

  if (state.api.tab === 'resp') {
    const sample = e.resp || (isList ? { code: 200, msg: '查询成功', rows: [], total: 0 } : { code: 200, msg: '操作成功', data: {} });
    const src = e.respSource === 'live' ? ['ok', '本地 Mock 实时数据'] : e.respSource === 'curated' ? ['cyan', '示例数据'] : ['warn', '官方文档示例'];
    const pv = previewCards(sample);
    const writeNote = !pv && e.method !== 'GET'
      ? '<div class="callout" style="margin:0 0 12px">写操作接口仅返回执行结果（<code>code</code> / <code>msg</code>），提交后的业务数据请到对应的列表或详情接口查看。</div>'
      : '';
    body.innerHTML = `
      <div class="code-h"><span class="t">响应示例</span>
        <span class="tag ${src[0]}" style="font-size:10px">${src[1]}</span>
        <span class="spacer"></span><span class="small muted" id="respSize"></span></div>
      ${writeNote}${pv}
      <pre class="code" style="margin-top:12px">${highlight(JSON.stringify(sample, null, 2))}</pre>
      <div class="callout" style="margin-top:14px">
        统一结构：列表 <code>{ code, msg, rows, total }</code>；详情/操作 <code>{ code, msg, data }</code>。
        <code>code=200</code> 表示成功，401 未授权，500 系统异常。
      </div>`;
    const sz = $('#respSize');
    if (sz) sz.textContent = `${(JSON.stringify(sample).length / 1024).toFixed(1)} KB`;
    return;
  }

  // 在线调试
  const pk = pathParams[0] ? pathParams[0].slice(1, -1) : null;
  body.innerHTML = `
    <div class="try">
      <div>
        <div class="field"><label class="lb">请求 URL</label>
          <input class="input mono" id="tyUrl" value="${esc(e.path)}" /></div>
        ${pk ? `<div class="field"><label class="lb">路径参数 {${pk}}</label><input class="input mono" id="tyPath" value="1" /></div>` : ''}
        ${isList ? `<div class="row" style="gap:10px">
          <div class="field" style="flex:1"><label class="lb">pageNum</label><input class="input mono" id="tyPage" value="1" /></div>
          <div class="field" style="flex:1"><label class="lb">pageSize</label><input class="input mono" id="tySize" value="8" /></div>
        </div>` : ''}
        ${e.method === 'GET' ? `
          <div class="field"><label class="lb">查询参数（a=1&amp;b=2 形式，可留空）</label>
            <input class="input mono" id="tyQuery" placeholder="${esc((e.queryKeys || []).map((k) => k + '=').join('&'))}" /></div>
          ` : `
          <div class="field"><label class="lb">请求体 JSON</label>
            <textarea class="textarea" id="tyBody" style="min-height:150px">${esc(bodySample(e))}</textarea></div>`}
        <button class="btn primary" id="tySend" style="width:100%">发送请求</button>
      </div>
      <div>
        <div class="code-h"><span class="t">响应结果</span><span class="spacer"></span><span class="small muted" id="tyMeta"></span></div>
        <pre class="code" id="tyResp" style="min-height:260px">// 点击左侧「发送请求」查看真实返回</pre>
      </div>
    </div>`;

  $('#tySend').onclick = async () => {
    let url = $('#tyUrl').value.trim();
    if (pk) url = url.replace(`{${pk}}`, $('#tyPath').value.trim() || '1');
    const parts = [];
    if (isList) { parts.push(`pageNum=${$('#tyPage').value || 1}`, `pageSize=${$('#tySize').value || 8}`); }
    const extra = ($('#tyQuery')?.value || '').trim();
    if (extra) parts.push(extra);
    if (parts.length) url += '?' + parts.join('&');
    const btn = $('#tySend'); btn.disabled = true; btn.textContent = '请求中…';
    try {
      const opt = { method: e.method };
      if (e.method !== 'GET' && $('#tyBody')) opt.body = safeJson($('#tyBody').value);
      const r = await api(url.replace('/prod-api', ''), opt);
      $('#tyResp').innerHTML = highlight(typeof r.body === 'string' ? r.body : JSON.stringify(r.body, null, 2));
      $('#tyMeta').innerHTML = `<span class="tag ${r.status === 200 ? 'ok' : 'danger'}">HTTP ${r.status}</span>
        <span class="tag">${r.ms}ms</span><span class="tag">${(r.size / 1024).toFixed(1)}KB</span>`;
      state.api.resp = r;
    } catch (err) {
      $('#tyResp').textContent = '请求失败：' + err.message;
    } finally { btn.disabled = false; btn.textContent = '发送请求'; }
  };
}

const SAMPLE = {
  username: 'test02', password: '123456', newPassword: '123789', oldPassword: '123456',
  nickName: '测试用户02', phonenumber: '13800000000', sex: '0', email: 'test02@example.com',
  idCard: '210211199909090014', plateNo: '辽B12345', type: '汽油车', content: '这是一条示例内容',
  title: '示例标题', name: '张三', tel: '13800000000', phone: '13800000000', money: 100,
  score: 5, amount: 10, sellerId: 1, productId: 1, quantity: 1, addressDetail: '大连理工大学教学楼 A3-118',
  orderNo: '2026101120444612594', carId: 1, lotId: 1, newsId: 1, activityId: 1, lawyerId: 1,
  legalExpertiseId: 1, doctorId: 9, typeId: 9, inquiryId: 1, dishesId: 1, paymentNo: '15674939',
  billNo: '202610271358091', movieId: 1, theaterId: 1, roomId: 1, timesId: 1, seatId: 1,
  patientName: '王大卫', reserveTime: '2026-11-05 09:00', categoryId: 1, num: 2,
  appealCategoryId: 1, imageUrls: '', files: '', avatar: '', introduction: '示例描述',
};

const IMG_KEYS = ['imgUrl', 'cover', 'advImg', 'pic', 'avatar', 'avatarUrl', 'imageUrls', 'productImage', 'dishesImg', 'icon', 'poster'];
const TITLE_KEYS = ['title', 'name', 'parkName', 'advTitle', 'sellerName', 'hospitalName', 'companyName', 'filmName',
  'goodsName', 'dishesName', 'doctorName', 'lawyerName', 'activityName', 'serviceName', 'userName', 'nickName', 'orderNo'];
const SUB_KEYS = ['subTitle', 'address', 'introduction', 'description', 'content', 'brief', 'detail', 'notice', 'typeName', 'categoryName', 'stateName'];

function previewCards(sample) {
  let rows = [];
  if (Array.isArray(sample?.rows)) rows = sample.rows;
  else if (Array.isArray(sample?.data)) rows = sample.data;
  else if (sample?.data && typeof sample.data === 'object') rows = [sample.data];
  else if (sample?.user) rows = [sample.user];
  if (!rows.length) return '';
  const pickField = (o, keys) => keys.map((k) => o?.[k]).find((v) => typeof v === 'string' && v);
  const cards = rows.slice(0, 4).map((o) => {
    if (!o || typeof o !== 'object') return '';
    const isImg = (v) => typeof v === 'string' && v.length > 3 &&
      (/^(data:|https?:|\/|\.{0,2}\/)/.test(v) || /\.(jpe?g|png|webp|svg)(\?|$)/i.test(v));
    const imgKey = IMG_KEYS.find((k) => isImg(o[k]));
    const img = imgKey ? String(o[imgKey]).split(',')[0] : '';
    const title = pickField(o, TITLE_KEYS) || '(无标题字段)';
    let sub = pickField(o, SUB_KEYS) || '';
    sub = sub.replace(/<[^>]+>/g, '').slice(0, 42);
    const price = ['price', 'amount', 'money', 'score', 'vacancy'].map((k) => o[k]).find((v) => v !== undefined && v !== null && v !== '');
    return `<div class="pv">
      <div class="pv-img">${img ? `<img src="${esc(img)}" alt="" loading="lazy" onerror="this.style.display='none'"/>` : '<span class="pv-no">无图</span>'}</div>
      <div class="pv-t">${esc(title)}</div>
      ${sub ? `<div class="pv-s">${esc(sub)}</div>` : ''}
      ${price !== undefined ? `<div class="pv-p">${esc(price)}</div>` : ''}
    </div>`;
  }).filter(Boolean).join('');
  if (!cards) return '';
  return `<div class="pv-wrap"><div class="pv-h">数据预览 · 取响应中的前 ${Math.min(rows.length, 4)} 条</div><div class="pv-grid">${cards}</div></div>`;
}

function bodySample(e) {
  const o = {};
  (e.params || []).forEach((p) => {
    if (p.type?.includes('int') || p.type?.includes('number')) o[p.name] = typeof SAMPLE[p.name] === 'number' ? SAMPLE[p.name] : 1;
    else if (SAMPLE[p.name] !== undefined) o[p.name] = SAMPLE[p.name];
    else o[p.name] = '';
  });
  if (!Object.keys(o).length) { o.username = 'test02'; o.password = '123456'; }
  return JSON.stringify(o, null, 2);
}
function safeJson(s) { try { return JSON.parse(s); } catch { return {}; } }

/* ---------------------------------------------------------------- 题库 */
function openTask(id) {
  const t = state.tasks.find((x) => x.id === id);
  if (!t) return;
  const done = state.done.has(id);
  const mask = document.createElement('div');
  mask.className = 'modal-mask';
  mask.innerHTML = `
    <div class="modal">
      <div class="modal-h">
        <div style="flex:1">
          <div class="row" style="margin-bottom:6px">
            <span class="task-id">${t.id}</span>
            <span class="tag cyan">${esc(t.module)}</span>
            ${levelTag(t.level)}
            <span class="tag">约 ${t.minutes} 分钟</span>
            ${done ? '<span class="tag ok">已完成</span>' : ''}
          </div>
          <h2 style="margin:0;font-size:18px">${esc(t.title)}</h2>
        </div>
        <button class="btn icon" id="mClose">✕</button>
      </div>
      <div class="modal-b">
        <div class="blk"><h4>任务目标</h4><p style="margin:0;color:var(--txt-2);font-size:13.5px">${esc(t.goal)}</p></div>
        <div class="blk"><h4>需求点</h4><ul class="req">${t.reqs.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>
        <div class="blk"><h4>验收标准</h4><ul class="req ac">${t.accept.map((r) => `<li>${esc(r)}</li>`).join('')}</ul></div>
        <div class="blk"><h4>涉及接口</h4>${t.apis.map((a) => {
          const [m, p] = a.split(' ');
          const ep = state.endpoints.find((x) => x.method === m && x.path === p);
          return `<div class="api-ref" data-ep="${ep ? ep.id : ''}"><span class="m ${m}">${m}</span><span>${esc(p)}</span></div>`;
        }).join('')}</div>
        <div class="callout warn"><b>易错点：</b>${esc(t.tip)}</div>
      </div>
      <div class="modal-f">
        <button class="btn ${done ? '' : 'primary'}" id="mDone">${done ? '标记为未完成' : '标记为已完成'}</button>
        <span class="spacer"></span>
        <button class="btn ghost" id="mClose2">关闭</button>
      </div>
    </div>`;
  document.body.appendChild(mask);
  const close = () => mask.remove();
  mask.onclick = (ev) => { if (ev.target === mask) close(); };
  $('#mClose', mask).onclick = close;
  $('#mClose2', mask).onclick = close;
  $('#mDone', mask).onclick = () => {
    if (state.done.has(id)) state.done.delete(id); else state.done.add(id);
    LS.set('tasks_done', [...state.done]);
    close(); vTasks(); toast(state.done.has(id) ? '已标记完成' : '已取消完成', 'ok');
  };
  $$('.api-ref', mask).forEach((el) => el.onclick = () => {
    if (!el.dataset.ep) return;
    state.api.sel = el.dataset.ep; state.api.mod = '全部'; state.api.q = ''; state.api.tab = 'params';
    close(); location.hash = '#/api';
  });
}

function vTasks() {
  const mods = ['全部', ...new Set(state.tasks.map((t) => t.module))];
  const levels = ['全部', '入门', '进阶', '挑战'];
  const list = state.tasks.filter((t) => (state.taskMod === '全部' || t.module === state.taskMod) && (state.taskLevel === '全部' || t.level === state.taskLevel));
  const pct = Math.round((state.done.size / state.tasks.length) * 100);

  $('#view').innerHTML = `
  <div class="view">
    <div class="card" style="margin-bottom:16px">
      <div class="row wrap" style="gap:12px">
        <div>
          <div class="small muted">总体进度</div>
          <div style="font-size:22px;font-weight:700;font-family:var(--mono)">${state.done.size} <span class="muted" style="font-size:14px">/ ${state.tasks.length}</span></div>
        </div>
        <div style="flex:1;min-width:200px"><div class="progress-bar" style="margin:0"><i style="width:${pct}%"></i></div>
          <div class="small muted" style="margin-top:6px">完成度 ${pct}%</div></div>
        <div class="chips">${levels.map((l) => `<span class="chip ${state.taskLevel === l ? 'active' : ''}" data-lv="${l}">${l}</span>`).join('')}</div>
      </div>
    </div>
    <div class="chips scroll" style="margin-bottom:16px">${mods.map((m) => `<span class="chip ${state.taskMod === m ? 'active' : ''}" data-md="${esc(m)}">${esc(m)}</span>`).join('')}</div>
    <div class="task-grid">
      ${list.map((t) => `
        <div class="task ${state.done.has(t.id) ? 'done' : ''}" data-id="${t.id}">
          <div class="task-h">
            <div style="flex:1"><h3 class="task-t">${esc(t.title)}</h3></div>
            <span class="task-id">${t.id}</span>
          </div>
          <div class="task-g">${esc(t.goal)}</div>
          <div class="task-f">
            <span class="tag cyan">${esc(t.module)}</span>${levelTag(t.level)}
            <span class="sp"></span>
            <span class="mono">${t.minutes}min</span>
            ${state.done.has(t.id) ? '<span class="tag ok">✓</span>' : ''}
          </div>
        </div>`).join('')}
    </div>
    ${list.length ? '' : '<div class="empty">该筛选下暂无任务</div>'}
  </div>`;

  $$('[data-lv]').forEach((el) => el.onclick = () => { state.taskLevel = el.dataset.lv; vTasks(); });
  $$('[data-md]').forEach((el) => el.onclick = () => { state.taskMod = el.dataset.md; vTasks(); });
  $$('.task').forEach((el) => el.onclick = () => openTask(el.dataset.id));
}

/* ---------------------------------------------------------------- 参考实现 */
function vDemo() {
  const pages = [['home', '首页'], ['news', '新闻'], ['park', '停车场'], ['food', '外卖'], ['metro', '地铁'], ['movie', '电影'], ['me', '我的']];
  $('#view').innerHTML = `
  <div class="view">
    <div class="demo-layout">
      <div class="phone"><iframe id="demoFrame" src="/demo.html"></iframe></div>
      <div class="demo-side">
        <div class="card">
          <div class="card-h"><h3>页面切换</h3><span class="sub">真实调用本地接口</span></div>
          <div class="chips" id="demoChips">
            ${pages.map(([k, t]) => `<span class="chip ${state.demoPage === k ? 'active' : ''}" data-p="${k}">${t}</span>`).join('')}
          </div>
          <div class="divider"></div>
          <div class="demo-note">
            左侧是一份可直接运行的移动端参考实现（HTML + 原生 JS）。它没有使用任何框架，
            每个页面都真实调用 <b>/prod-api</b> 接口，可以用来对照「文档字段 → 界面元素」的映射关系。
          </div>
        </div>
        <div class="card">
          <div class="card-h"><h3>关键代码</h3><span class="sub">统一请求封装</span></div>
          <pre class="code" style="max-height:300px">${highlight(`// 1. 登录拿 token
const r = await fetch('/prod-api/api/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'test02', password: '123456' })
});
const { token } = await r.json();

// 2. 带 token 请求
const res = await fetch('/prod-api/api/common/user/getInfo', {
  headers: { Authorization: token }
});

// 3. 分页列表
const list = await fetch(
  '/prod-api/press/press/list?pageNum=1&pageSize=8'
).then(r => r.json());
// list.rows 是数组，list.total 是总数`)}</pre>
        </div>
        <div class="callout warn" style="margin:0">
          参考实现只演示数据绑定与交互，不包含竞赛要求的全部细节（动效、异常态、权限等），请以练习任务的验收标准为准。
        </div>
      </div>
    </div>
  </div>`;
  $('#demoChips').onclick = (e) => {
    const c = e.target.closest('[data-p]');
    if (!c) return;
    state.demoPage = c.dataset.p;
    $$('#demoChips .chip').forEach((x) => x.classList.toggle('active', x === c));
    $('#demoFrame').contentWindow.postMessage({ type: 'goto', page: state.demoPage }, '*');
  };
}

/* ---------------------------------------------------------------- 调试台 */
function vDebug() {
  const paths = state.endpoints.map((e) => e.path);
  $('#view').innerHTML = `
  <div class="view">
    <div class="debug-grid">
      <div class="card">
        <div class="card-h"><h3>请求</h3><span class="sub">支持 GET / POST / PUT / DELETE</span></div>
        <div class="row" style="gap:8px;margin-bottom:12px">
          <select class="select" id="dbMethod" style="width:110px">
            ${['GET', 'POST', 'PUT', 'DELETE'].map((m) => `<option ${state.debug.method === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
          <input class="input mono" id="dbPath" list="epList" value="${esc(state.debug.path)}" />
          <datalist id="epList">${paths.map((p) => `<option value="${esc(p)}">`).join('')}</datalist>
        </div>
        <div class="field"><label class="lb">请求头（每行 Key: Value）</label>
          <textarea class="textarea" id="dbHeaders" style="min-height:60px" placeholder="Content-Type: application/json">${esc(state.debug.headers)}</textarea></div>
        <div class="field"><label class="lb">请求体（仅 POST / PUT）</label>
          <textarea class="textarea" id="dbBody" style="min-height:130px">${esc(state.debug.body)}</textarea></div>
        <div class="row"><button class="btn primary" id="dbSend" style="flex:1">发送</button>
          <button class="btn" id="dbToken">填充 Token</button></div>
      </div>
      <div class="card">
        <div class="card-h"><h3>响应</h3><div class="right" id="dbMeta">${state.debug.meta ? `<span class="tag ${state.debug.meta.status === 200 ? 'ok' : 'danger'}">${state.debug.meta.status}</span><span class="tag">${state.debug.meta.ms}ms</span><span class="tag">${state.debug.meta.size}B</span>` : ''}</div></div>
        <pre class="code" id="dbResp" style="min-height:330px">${state.debug.resp ? highlight(typeof state.debug.resp === 'string' ? state.debug.resp : JSON.stringify(state.debug.resp, null, 2)) : '// 等待请求'}</pre>
      </div>
    </div>
    <div class="card" style="margin-top:16px">
      <div class="card-h"><h3>请求历史</h3><div class="right"><button class="btn sm ghost" id="dbClear">清空</button></div></div>
      <div id="dbHist">${state.debug.hist.length ? state.debug.hist.map((h, i) => `
        <div class="hist-item" data-h="${i}"><span class="m ${h.method}">${h.method}</span>
        <span>${esc(h.path)}</span><span class="st ${h.status === 200 ? 'ok' : 'bad'}">${h.status}</span>
        <span class="muted">${h.ms}ms</span></div>`).join('') : '<div class="empty">暂无记录</div>'}</div>
    </div>
  </div>`;

  $('#dbSend').onclick = async () => {
    const method = $('#dbMethod').value;
    const p = $('#dbPath').value.trim();
    const headers = {};
    ($('#dbHeaders').value || '').split('\n').forEach((line) => {
      const i = line.indexOf(':');
      if (i > 0) headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
    });
    const btn = $('#dbSend'); btn.disabled = true; btn.textContent = '发送中…';
    try {
      const opt = { method, headers };
      if (method !== 'GET' && $('#dbBody').value.trim()) { opt.body = JSON.parse($('#dbBody').value); headers['Content-Type'] = 'application/json'; }
      const r = await api(p.replace('/prod-api', ''), opt);
      state.debug.resp = r.body;
      state.debug.meta = { status: r.status, ms: r.ms, size: r.size };
      state.debug.hist.unshift({ method, path: p, status: r.status, ms: r.ms, t: Date.now() });
      state.debug.hist = state.debug.hist.slice(0, 12);
      LS.set('hist', state.debug.hist);
      vDebug();
    } catch (e) {
      $('#dbResp').textContent = '请求失败：' + e.message;
    } finally { btn.disabled = false; btn.textContent = '发送'; }
  };
  $('#dbMethod').onchange = (e) => { state.debug.method = e.target.value; };
  $('#dbPath').oninput = (e) => { state.debug.path = e.target.value; };
  $('#dbBody').oninput = (e) => { state.debug.body = e.target.value; };
  $('#dbHeaders').oninput = (e) => { state.debug.headers = e.target.value; };
  $('#dbToken').onclick = () => { $('#dbHeaders').value = 'Authorization: ' + (AUTH_TOKEN() || '<先点右上角快速登录>'); };
  $('#dbClear').onclick = () => { state.debug.hist = []; LS.set('hist', []); vDebug(); };
  $$('.hist-item').forEach((el) => el.onclick = () => {
    const h = state.debug.hist[el.dataset.h];
    state.debug.method = h.method; state.debug.path = h.path; state.debug.resp = null;
    state.debug.meta = null; vDebug();
  });
}

/* ---------------------------------------------------------------- 图标 */
function vIcons() {
  const q = (state.iconQ || '').toLowerCase();
  const list = state.icons.filter((i) => !q || i.n.toLowerCase().includes(q));
  $('#view').innerHTML = `
  <div class="view">
    <div class="card" style="margin-bottom:16px">
      <div class="row wrap">
        <input class="input" id="icQ" placeholder="搜索图标名称，如 地铁 / 搜索 / 违章…" style="max-width:340px" value="${esc(state.iconQ || '')}" />
        <span class="small muted">共 ${state.icons.length} 个 · 点击复制路径，双击下载</span>
      </div>
    </div>
    <div class="icon-grid" id="icGrid">
      ${list.map((i) => `<div class="icon-cell" data-f="${esc(i.f)}" title="${esc(i.n)}">
        <div class="ibox ${i.lum >= 170 ? 'dark' : ''}"><img src="/icons/${encodeURIComponent(i.f)}" loading="lazy" alt="${esc(i.n)}" /></div>
        <div class="n">${esc(i.n.replace(/\.(png|svg)$/i, ''))}</div></div>`).join('')}
    </div>
    ${list.length ? '' : '<div class="empty">没有匹配的图标</div>'}
  </div>`;
  $('#icQ').oninput = (e) => { state.iconQ = e.target.value; vIcons(); $('#icQ').focus(); };
  $$('.icon-cell').forEach((el) => {
    el.onclick = () => copy(`/icons/${el.dataset.f}`, '已复制图标路径');
    el.ondblclick = () => {
      const a = document.createElement('a');
      a.href = 'icons/' + encodeURIComponent(el.dataset.f);
      a.download = el.dataset.f;
      a.click();
    };
  });
}

/* ---------------------------------------------------------------- 速查 */
function vGuide() {
  const dictRows = [
    ['order_status', '订单状态', '0 未支付 / 1 已支付'],
    ['tk_order_status', '外卖订单', '待评价 / 完成'],
    ['car_type', '车辆类型', '汽油车 / 新能源车'],
    ['film_category', '影片类型', '1 故事 · 2 爱情 · 3 动作 · 4 喜剧 · 5 恐怖 · 6 惊悚 · 7 战争 · 8 科幻'],
    ['adv_type', '广告类型', '1 引导页 / 2 主页'],
    ['balance_log_type', '钱包变动', '收入 / 支出'],
    ['function_type', '服务类型', '生活服务 / 车主服务'],
  ];
  $('#view').innerHTML = `
  <div class="view doc">
    <div class="card">
      <h2>服务与鉴权</h2>
      <p>所有接口以 <code>/prod-api</code> 为前缀，返回 JSON。列表接口统一分页参数 <code>pageNum</code>（页码，从 1 开始）与 <code>pageSize</code>（每页条数）。</p>
      <p>需要登录的接口在请求头携带 token：</p>
      <div class="code-inline">Authorization: eyJhbGciOiJIUzUxMiJ9.eyJsb2dpbl91c2VyX2tleSI6...</div>
      <div class="callout">平台内置 Mock 服务地址为 <code>http://localhost:10091</code>，与官方文档的路径结构完全一致，改 Base URL 即可切换。<br/>
      测试账号：<code>test02 / 123456</code>。原始服务器 124.93.196.45:10091 目前已无法访问，练习时请使用本地 Mock。</div>

      <h2>状态码</h2>
      <table class="tb"><thead><tr><th style="width:120px">code</th><th>含义</th><th>处理建议</th></tr></thead><tbody>
        <tr><td class="k">200</td><td>正常</td><td>按业务字段渲染</td></tr>
        <tr><td class="k">401</td><td>未授权</td><td>跳转登录页，清除本地 token</td></tr>
        <tr><td class="k">403</td><td>禁止访问</td><td>提示无权限</td></tr>
        <tr><td class="k">404</td><td>未找到资源</td><td>提示数据不存在</td></tr>
        <tr><td class="k">500</td><td>系统异常</td><td>Toast 提示 msg 内容</td></tr>
      </tbody></table>

      <h2>响应结构</h2>
      <p>列表：<code>{ code, msg, rows, total }</code>；详情与操作：<code>{ code, msg, data }</code>；登录额外返回 <code>token</code>。</p>
      <div class="callout warn">部分接口（如影院详情、电影场次）返回的是 <code>rows</code> 为对象的怪异结构，写解析时要做类型判断，不能假定 rows 一定是数组。</div>

      <h2>示例数据与图片</h2>
      <p>接口文档里的「响应示例」不再是空壳：<b>255 个接口</b>展示的是本地 Mock 服务的真实返回（含中文标题、正文、价格等），
      另 50 个写操作接口只返回 <code>{ code, msg }</code> 执行结果，属于正常设计。</p>
      <p>所有图片字段（<code>imgUrl</code> / <code>cover</code> / <code>advImg</code> / <code>avatar</code> 等）均指向本地
      <code>/img/xxx.jpg</code>，文档原地址（<code>118.190.154.52:7777</code>、<code>/dev-api/profile/...</code>）已全部失效并被替换。</p>
      <div class="callout">响应示例页顶部标签会标明数据来源：<span class="tag ok" style="font-size:10px">本地 Mock 实时数据</span>
      或 <span class="tag warn" style="font-size:10px">官方文档示例</span>。写页面时以「字段 + 类型」为准，不要照抄具体数值。</div>

      <h2>系统字典</h2>
      <p>通过 <code>GET /prod-api/api/system/dict/data/type/{dictType}</code> 获取，返回 <code>data</code> 数组，元素含 <code>dictLabel</code>（展示值）与 <code>dictValue</code>（提交值）。</p>
      <table class="tb"><thead><tr><th style="width:180px">dictType</th><th style="width:130px">含义</th><th>取值</th></tr></thead><tbody>
        ${dictRows.map(([t, n, v]) => `<tr><td class="k">${t}</td><td>${n}</td><td class="small">${v}</td></tr>`).join('')}
      </tbody></table>
      <div class="callout">字典值不要写死在代码里，用接口拉取后再渲染，是这类赛项的常见加分点。</div>

      <h2>广告轮播跳转约定</h2>
      <p>轮播实体包含 <code>servModule</code>（业务模块名）与 <code>targetId</code>（目标详情 id）。例如：</p>
      <table class="tb"><thead><tr><th style="width:180px">servModule</th><th>跳转目标</th></tr></thead><tbody>
        <tr><td class="k">新闻资讯</td><td>新闻详情页，参数 newsId = targetId</td></tr>
        <tr><td class="k">外卖店家</td><td>店家详情页，参数 sellerId = targetId</td></tr>
        <tr><td class="k">停哪儿</td><td>停车场详情页，参数 lotId = targetId</td></tr>
        <tr><td class="k">城市地铁</td><td>地铁资讯详情，参数 id = targetId</td></tr>
      </tbody></table>

      <h2>常见坑</h2>
      <ul>
        <li><b>类型不一致</b>：<code>vacancy</code>、<code>priceCaps</code>、<code>money</code> 等字段常以字符串返回，排序、求和在转数字后再做。</li>
        <li><b>布尔与字符串混用</b>：<code>isDefault</code>、<code>recommend</code> 用 <code>'Y' / 'N'</code> 或 <code>'1' / '0'</code>，不要用 <code>true/false</code> 判断。</li>
        <li><b>富文本</b>：<code>content</code> 是 HTML 字符串，需按富文本渲染，否则会显示一堆标签。</li>
        <li><b>图片相对路径</b>：形如 <code>/profile/upload/...</code> 的地址需要拼上服务端域名。</li>
        <li><b>分页到底</b>：用 <code>rows.length === 0</code> 或累计条数 ≥ <code>total</code> 判断结束，避免无限加载。</li>
        <li><b>时间格式</b>：后端多为 <code>yyyy-MM-dd HH:mm:ss</code>，展示时自行格式化，不要直接截字符串。</li>
      </ul>

      <h2>提交检查清单</h2>
      <ul>
        <li>启动即可用，无白屏与崩溃</li>
        <li>所有网络请求有 loading、失败提示与重试</li>
        <li>列表有空状态、有到底提示、下拉可刷新</li>
        <li>表单有必填校验与格式校验，提交有防重复点击</li>
        <li>切后台再回来数据不丢失，登录态可保持</li>
        <li>适配常见分辨率，无横向滚动与文字溢出</li>
      </ul>
    </div>
  </div>`;
}

/* ---------------------------------------------------------------- 启动 */
async function boot() {
  if (window.API_READY) { try { await window.API_READY; } catch {} }
  renderNav();
  try {
    const [eps, tasks, icons] = await Promise.all([
      fetch('data/endpoints.json').then((r) => r.json()),
      fetch('data/tasks.json').then((r) => r.json()),
      fetch('data/icons.json').then((r) => r.json()),
    ]);
    const ORDER = ['通用接口','停哪儿','城市地铁','外卖订餐','找工作','找房子','智慧交管','活动管理','生活交费','看电影','门诊预约','智慧巴士','政府服务热线','法律咨询','志愿活动','数字图书馆','垃圾分类宝典','青年驿站','爱心公益','物流查询','宠物医院','厨房助手'];
    eps.sort((a, b) => (ORDER.indexOf(a.module) - ORDER.indexOf(b.module)) || a.path.localeCompare(b.path));
    eps.forEach((e) => {
      if (!e.name) {
        const seg = e.path.replace('/prod-api', '').split('/').filter(Boolean);
        const act = { login: '用户登录', register: '用户注册', logout: '退出登录' }[seg[seg.length - 1]];
        e.name = act || seg.slice(-2).join(' / ');
      }
    });
    state.endpoints = eps; state.tasks = tasks; state.icons = icons;
    const b = $$('.badge-n');
    if (b[0]) b[0].textContent = eps.length;
    if (b[1]) b[1].textContent = tasks.length;
  } catch (e) {
    console.error(e);
    toast('数据加载失败', 'err');
  }

  $('#hdot').className = 'dot';
  const host = location.origin;
  $('#baseUrl').textContent = host + '/prod-api';
  $('#baseChip').onclick = () => copy(host + '/prod-api', '已复制 Base URL');

  $('#btnLogin').onclick = async () => {
    try {
      const r = await api('/api/login', { method: 'POST', body: { username: 'test02', password: '123456' } });
      if (r.body?.token) {
        LS.set('token', r.body.token);
        toast('登录成功，token 已保存', 'ok');
        $('#btnLogin').textContent = '已登录';
        $('#btnLogin').classList.add('primary');
      } else toast(r.body?.msg || '登录失败', 'err');
    } catch { toast('无法连接 Mock 服务', 'err'); }
  };
  if (AUTH_TOKEN()) { $('#btnLogin').textContent = '已登录'; $('#btnLogin').classList.add('primary'); }

  if (window.API_MODE === 'static') {
    $('#hdot').className = 'dot';
    $('#htxt').textContent = `静态演示 · ${state.endpoints.length} 接口`;
    $('#baseUrl').textContent = 'static-api（预生成）';
    $('#baseChip').onclick = () => copy(location.href.split('#')[0], '已复制站点地址');
    $('#btnLogin').onclick = async () => {
      const r = await api('/api/login', { method: 'POST', body: { username: 'test02', password: '123456' } });
      if (r.body?.token) { LS.set('token', r.body.token); toast('登录成功（静态演示）', 'ok'); $('#btnLogin').textContent = '已登录'; $('#btnLogin').classList.add('primary'); }
      else toast(r.body?.msg || '登录失败', 'err');
    };
  } else {
    try {
      const h = await fetch('mock/health').then((r) => r.json());
      $('#htxt').textContent = `Mock 在线 · ${h.endpoints} 接口`;
    } catch {
      $('#hdot').className = 'dot off';
      $('#htxt').textContent = 'Mock 离线';
    }
  }

  window.addEventListener('hashchange', route);
  route();
}

boot();
