/* 静态 Mock 层：纯静态托管（GitHub Pages 等）时拦截 /prod-api 请求，返回预生成的 JSON */
(function () {
  const nativeFetch = window.fetch.bind(window);
  const cache = new Map();
  const SUBSTRING_KEYS = new Set(['title', 'name', 'parkName', 'keyword', 'searchValue', 'companyName', 'dishName']);

  const manifestPromise = nativeFetch('static-api/manifest.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : []))
    .catch(() => []);

  function load(file) {
    if (!cache.has(file)) {
      cache.set(file, nativeFetch(file, { cache: 'force-cache' }).then((r) => r.json()));
    }
    return cache.get(file);
  }

  function matchPath(pattern, pathname) {
    const ps = pattern.split('/');
    const qs = pathname.split('/');
    if (ps.length !== qs.length) return null;
    const params = {};
    for (let i = 0; i < ps.length; i++) {
      if (ps[i].startsWith('{')) params[ps[i].slice(1, -1)] = decodeURIComponent(qs[i]);
      else if (ps[i] !== qs[i]) return null;
    }
    return params;
  }

  const jsonResp = (obj, status) =>
    new Response(JSON.stringify(obj), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'X-Mock': 'static' },
    });

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function filterItems(items, search) {
    let out = items;
    for (const [k, v] of search.entries()) {
      if (k === 'pageNum' || k === 'pageSize' || v === '') continue;
      if (!out.length) break;
      if (!out.some((it) => it && k in it)) continue; // 数据集没有该字段则忽略
      out = out.filter((it) => {
        const val = it[k];
        if (val === undefined || val === null) return false;
        if (SUBSTRING_KEYS.has(k)) return String(val).includes(v);
        return String(val) === String(v);
      });
    }
    return out;
  }

  window.fetch = async function (input, init) {
    const raw = typeof input === 'string' ? input : (input && input.url) || String(input);
    let url;
    try { url = new URL(raw, location.href); } catch { return nativeFetch(input, init); }

    if (!/\/prod-api\//.test(url.pathname)) return nativeFetch(input, init);

    const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
    const manifest = await manifestPromise;

    let hit = null;
    let params = null;
    for (const e of manifest) {
      if (e.method !== method) continue;
      const p = matchPath(e.pattern, url.pathname);
      if (p) { hit = e; params = p; break; }
    }

    await sleep(80);

    if (!hit) {
      return jsonResp(
        { code: 404, msg: '静态演示模式：该接口未预置数据', _static: true, _path: url.pathname },
        404
      );
    }

    let data;
    try { data = await load(hit.file); } catch (e) {
      return jsonResp({ code: 500, msg: '静态数据加载失败：' + hit.file }, 500);
    }

    if (data.kind === 'list') {
      let items = data.items || [];
      items = filterItems(items, url.searchParams);
      const pageNum = Math.max(1, parseInt(url.searchParams.get('pageNum') || '1', 10) || 1);
      const pageSize = Math.min(200, Math.max(1, parseInt(url.searchParams.get('pageSize') || '10', 10) || 10));
      const rows = items.slice((pageNum - 1) * pageSize, pageNum * pageSize);
      return jsonResp({
        code: 200,
        msg: '查询成功',
        rows,
        total: items.length,
        _static: true,
      });
    }

    if (data.kind === 'detail') {
      const id = (params && (params.id || params.userId || params.no)) || url.pathname.split('/').pop();
      const item = (data.byId && (data.byId[id] || data.byId[String(Number(id))])) || (data.byId && Object.values(data.byId)[0]);
      if (!item) return jsonResp({ code: 404, msg: '未找到资源（静态演示）', _static: true }, 404);
      return jsonResp(Object.assign({}, item, { _static: true }));
    }

    return jsonResp(Object.assign({}, data.resp, { _static: true }));
  };

  window.__STATIC_MOCK_READY = manifestPromise;
})();
