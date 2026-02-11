(() => {
  const path = window.location.pathname.replace(/\/+$/, "");
  const isSearch = (p) => p === "/search" || p.endsWith("/search");
  if (!isSearch(path)) return;

  const params = new URLSearchParams(window.location.search);
  const q = (params.get("q") || params.get("s") || params.get("query") || "").trim();
  if (!q) return;

  // ✅ 只触发 input/change：PaperMod 搜索监听 input 就会实时渲染结果
  function triggerInput(input) {
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  }

  // 轻微“抖动”：避免某些实现只在 value 变化时触发（但仍只用 input/change）
  function nudgeValue(input) {
    const original = input.value;
    input.value = original + "\u200B"; // 零宽空格
    triggerInput(input);
    input.value = original;
    triggerInput(input);
  }

  function applyOnce() {
    const input = document.getElementById("searchInput") || document.querySelector(".search-input") || document.querySelector('input[type="search"]');

    if (!input) return false;

    input.value = q;

    try {
      input.focus();
      input.setSelectionRange(q.length, q.length);
    } catch (_) {}

    triggerInput(input);
    nudgeValue(input);
    return true;
  }

  const run = () => {
    applyOnce();
    setTimeout(applyOnce, 80);
    setTimeout(applyOnce, 200);
    setTimeout(applyOnce, 500);
    setTimeout(applyOnce, 1000);
    setTimeout(applyOnce, 1600);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  // 如果结果列表渲染更晚，再补一次（不做键盘事件）
  const resultsEl = document.getElementById("searchResults");
  if (resultsEl) {
    const mo = new MutationObserver(() => {
      // 一旦有渲染迹象，补一次输入触发即可
      applyOnce();
      mo.disconnect();
    });
    mo.observe(resultsEl, { childList: true, subtree: true });
  }
})();
