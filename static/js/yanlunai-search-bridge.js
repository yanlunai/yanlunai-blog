(() => {
  // 只在 /search/ 页面生效
  const isSearchPage = location.pathname === "/search/" || location.pathname.startsWith("/search/");
  if (!isSearchPage) return;

  function getQueryParam(name) {
    const url = new URL(location.href);
    // 兼容 ?q=rag 和 ?s=rag（留个后门）
    const v = url.searchParams.get(name);
    return v == null ? "" : v;
  }

  function normalizeQuery(q) {
    // URLSearchParams 已经 decode 过，但这里再做一次稳妥处理
    const s = String(q || "").trim();
    return s;
  }

  function fireEvents(el) {
    // PaperMod search.js 可能监听 input/keyup/change
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter" }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  }

  function waitForEl(selector, timeoutMs = 5000) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const tick = () => {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        if (Date.now() - start > timeoutMs) return reject(new Error("timeout"));
        requestAnimationFrame(tick);
      };
      tick();
    });
  }

  async function applyQueryToSearchInput() {
    const q = normalizeQuery(getQueryParam("q") || getQueryParam("s"));
    if (!q) return;

    // 等 PaperMod 的 searchInput 挂载完
    let input;
    try {
      input = await waitForEl("#searchInput", 8000);
    } catch {
      return;
    }

    // 如果已经一致，就不重复触发
    if (input.value !== q) input.value = q;

    // 关键：确保触发搜索
    // 有些情况下 search.js 还没把监听挂上，所以延迟两拍再触发一次
    fireEvents(input);
    setTimeout(() => fireEvents(input), 60);
    setTimeout(() => fireEvents(input), 180);
  }

  // DOMReady 后执行
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", applyQueryToSearchInput, { once: true });
  } else {
    applyQueryToSearchInput();
  }
})();
