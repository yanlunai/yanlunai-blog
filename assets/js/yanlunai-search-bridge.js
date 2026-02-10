(() => {
  // 只在 /search/ 页面生效（兼容 /search 与 /search/）
  const path = window.location.pathname.replace(/\/+$/, "");
  if (path !== "/search") return;

  const params = new URLSearchParams(window.location.search);

  // 兼容多种参数名：q / s / query
  const q = (params.get("q") || params.get("s") || params.get("query") || "").trim();
  if (!q) return;

  // 兼容 PaperMod 常见输入框选择器
  const input =
    document.getElementById("searchInput") ||
    document.querySelector(".search-input") ||
    document.querySelector('input[type="search"]') ||
    document.querySelector('input[name="q"]') ||
    document.querySelector('input[name="s"]') ||
    document.querySelector('input[name="query"]');

  if (!input) return;

  // 回填输入框
  input.value = q;

  // 触发一次 input，让原本的搜索脚本（lunr/fuse）开始工作
  input.dispatchEvent(new Event("input", { bubbles: true }));

  // 顺手把光标放到末尾，体验更像“已输入”
  try {
    input.focus();
    input.setSelectionRange(q.length, q.length);
  } catch (_) {}
})();
