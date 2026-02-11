(() => {
  // 只允许在首页运行（你也可以改成更精确：只在 home-search 容器存在时运行）
  const isSearchPage = location.pathname === "/search/" || document.querySelector(".page-search");
  if (isSearchPage) return;
  const path = window.location.pathname.replace(/\/+$/, "");
  const isSearch = (p) => p === "/search" || p.endsWith("/search");
  if (!isSearch(path)) return;

  const params = new URLSearchParams(window.location.search);
  const q = (params.get("q") || params.get("s") || params.get("query") || "").trim();
  if (!q) return;

  function fire(el, type, opts = {}) {
    el.dispatchEvent(new Event(type, { bubbles: true, ...opts }));
  }

  // ✅ 只在 input 上触发，不冒泡到 document，避免触发 PaperMod 的 document.onkeydown
  function fireKey(el, type) {
    try {
      el.dispatchEvent(
        new KeyboardEvent(type, {
          key: "a",
          code: "KeyA",
          keyCode: 65,
          which: 65,
          bubbles: false, // ⭐关键：不冒泡
          cancelable: true,
        })
      );
    } catch (_) {
      // 某些浏览器对 KeyboardEvent 限制较多，兜底用普通事件
      el.dispatchEvent(new Event(type, { bubbles: false }));
    }
  }

  // type="search" 的输入框，浏览器/部分脚本会监听 'search' 事件
  function fireSearchEvent(el) {
    try {
      el.dispatchEvent(new Event("search", { bubbles: true }));
    } catch (_) {}
  }

  function triggerAll(input) {
    // 1) 输入事件（常规）
    fire(input, "input");
    fire(input, "change");

    // 2) 很多 search.js 依赖 keyup 才 render（但我们不让它冒泡）
    fireKey(input, "keyup");

    // 3) type=search 的专用事件
    fireSearchEvent(input);
  }

  // 轻微 value 抖动：确保“值变化”被脚本捕获
  function nudgeValue(input) {
    const original = input.value;
    input.value = original + "\u200B";
    triggerAll(input);
    input.value = original;
    triggerAll(input);
  }

  function applyOnce() {
    const input = document.getElementById("searchInput") || document.querySelector(".search-input") || document.querySelector('input[type="search"]');

    if (!input) return false;

    input.value = q;

    try {
      input.focus();
      input.setSelectionRange(q.length, q.length);
    } catch (_) {}

    triggerAll(input);
    nudgeValue(input);
    return true;
  }

  function run() {
    applyOnce();
    setTimeout(applyOnce, 60);
    setTimeout(applyOnce, 160);
    setTimeout(applyOnce, 320);
    setTimeout(applyOnce, 700);
    setTimeout(applyOnce, 1200);
    setTimeout(applyOnce, 1800);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  // 结果区域若后渲染，再补一枪
  const resultsEl = document.getElementById("searchResults");
  if (resultsEl) {
    const mo = new MutationObserver(() => {
      applyOnce();
      // 有内容就停
      if (resultsEl.children && resultsEl.children.length > 0) mo.disconnect();
    });
    mo.observe(resultsEl, { childList: true, subtree: true });
  }
})();
