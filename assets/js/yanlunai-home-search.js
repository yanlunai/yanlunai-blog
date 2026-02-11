// assets/js/yanlunai-home-search.js
(() => {
  /**
   * ✅ 只允许首页运行（/ 或 /index/ 或 /index.html）
   * ✅ /search/ 及其它页面一律不运行，避免干扰 PaperMod search.js
   */
  const p = location.pathname.replace(/\/+$/, "/");
  const isHome = p === "/" || p === "/index/" || p === "/index.html";
  if (!isHome) return;

  // ====== 下面是“首页搜索”逻辑容器 ======
  // 你如果要做首页下拉搜索，把逻辑放这里（只操作首页自己的 input / results 容器）
  // ⚠️ 不要改 document.onkeydown
  // ⚠️ 不要给 document 加 keydown capture + stopImmediatePropagation
  // ⚠️ 不要去动 /search/ 的 #searchInput/#searchResults

  // 示例：如果你首页有一个输入框 class="yanlunai-search-input"
  // const homeInput = document.querySelector(".yanlunai-search-input");
  // if (!homeInput) return;
  // ... your home dropdown logic ...
})();
