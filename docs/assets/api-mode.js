/* 运行模式探测：本地有 Node 服务时走真实 Mock；纯静态托管时挂载静态 Mock 层 */
(function () {
  window.API_MODE = 'live';

  window.API_READY = (async () => {
    try {
      const r = await fetch('mock/health', { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        if (j && j.ok) return;
      }
    } catch (e) { /* 静态托管下会 404 或跨域失败 */ }

    window.API_MODE = 'static';
    await new Promise((resolve) => {
      const s = document.createElement('script');
      s.src = 'assets/static-mock.js';
      s.onload = resolve;
      s.onerror = resolve;
      document.head.appendChild(s);
    });
    if (window.__STATIC_MOCK_READY) {
      try { await window.__STATIC_MOCK_READY; } catch (e) {}
    }
  })();
})();
