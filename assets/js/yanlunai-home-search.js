(() => {
  const path = window.location.pathname.replace(/\/+$/, "");
  const isSearch = (p) => p === "/search" || p.endsWith("/search");
  if (!isSearch(path)) return;

  const params = new URLSearchParams(window.location.search);
  const q = (params.get("q") || params.get("s") || params.get("query") || "").trim();
  if (!q) return;

  // 触发一次“尽可能像用户输入”的事件序列
  function triggerAll(input) {
    // input/change 兼容大部分实现
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));

    // 兼容一些脚本监听 keyup/keydown
    input.dispatchEvent(new KeyboardEvent("keydown", { bubbles: true, key: "a" }));
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "a" }));

    // 有些实现只在 keyup 才跑
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter", code: "Enter" }));
  }

  // 轻微“抖动”：添加再删除一个零宽字符，模拟真正的输入变化（避免只读 value 变化不触发）
  function nudgeValue(input) {
    const original = input.value;
    // 使用零宽空格，不会影响视觉
    input.value = original + "\u200B";
    triggerAll(input);
    input.value = original;
    triggerAll(input);
  }

  function applyOnce() {
    const input = document.getElementById("searchInput") || document.querySelector(".search-input") || document.querySelector('input[type="search"]');

    if (!input) return false;

    // 回填
    input.value = q;

    // 聚焦与光标
    try {
      input.focus();
      input.setSelectionRange(q.length, q.length);
    } catch (_) {}

    // 触发（多种事件 + nudge）
    triggerAll(input);
    nudgeValue(input);

    return true;
  }

  // 1) DOM ready 后立即尝试一次
  const run = () => {
    // 如果 search.js 初始化更慢，我们后面还会补几枪
    applyOnce();
    setTimeout(applyOnce, 120);
    setTimeout(applyOnce, 350);
    setTimeout(applyOnce, 900);
    setTimeout(applyOnce, 1600);
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }

  // 2) 如果 searchResults 直到很晚才渲染，用 MutationObserver 再补一次（非常稳）
  const resultsEl = document.getElementById("searchResults");
  if (resultsEl) {
    const mo = new MutationObserver(() => {
      // 一旦结果开始渲染，就不需要继续观察了
      // 但如果始终空，也至少触发过了多次
      mo.disconnect();
    });
    mo.observe(resultsEl, { childList: true, subtree: true });
  }
})();
