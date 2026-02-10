(() => {
  // 兼容：/search 与 /search/
  const path = window.location.pathname.replace(/\/+$/, "");

  // 如果你未来启用多语言，search 可能变成 /zh/search，这里也兼容
  const isSearch = (p) => p === "/search" || p.endsWith("/search");

  if (!isSearch(path)) return;

  const params = new URLSearchParams(window.location.search);
  const q = (params.get("q") || params.get("s") || params.get("query") || "").trim();
  if (!q) return;

  const start = Date.now();
  const timer = setInterval(() => {
    // 兼容 PaperMod search input 常见选择器
    const input =
      document.getElementById("searchInput") ||
      document.querySelector(".search-input") ||
      document.querySelector('input[type="search"]') ||
      document.querySelector('input[placeholder*="Search"]') ||
      document.querySelector('input[placeholder*="search"]');

    if (!input) {
      if (Date.now() - start > 3000) clearInterval(timer);
      return;
    }

    clearInterval(timer);

    input.value = q;

    // 触发搜索脚本
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
    input.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true, key: "Enter", code: "Enter" }));

    try {
      input.focus();
      input.setSelectionRange(q.length, q.length);
    } catch (_) {}
  }, 80);
})();
