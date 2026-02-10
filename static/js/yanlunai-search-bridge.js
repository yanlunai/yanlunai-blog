(() => {
  // Only run on /search/ page
  const isSearchPage = () => location.pathname.replace(/\/+$/, "") === "/search";
  if (!isSearchPage()) return;

  const getQ = () => {
    const u = new URL(location.href);
    return (u.searchParams.get("q") || "").trim();
  };

  const q = getQ();
  if (!q) return;

  function triggerSearch(inputEl, value) {
    // 回填
    inputEl.value = value;

    // 关键：触发 PaperMod search.js 监听的事件
    const evInput = new Event("input", { bubbles: true });
    const evChange = new Event("change", { bubbles: true });
    const evKeyup = new KeyboardEvent("keyup", { bubbles: true, key: "a" });

    inputEl.dispatchEvent(evInput);
    inputEl.dispatchEvent(evChange);
    inputEl.dispatchEvent(evKeyup);
  }

  function runWithRetry() {
    const input = document.getElementById("searchInput");
    if (!input) return;

    // 立即触发一次
    triggerSearch(input, q);

    // 有些情况下 search.js 还没初始化监听器 => 做短时间重试
    let tries = 0;
    const maxTries = 30; // ~30 * 100ms = 3s
    const timer = setInterval(() => {
      tries++;

      // 如果结果容器已经出现内容，就停止
      const results = document.getElementById("searchResults");
      const hasResults = results && (results.children?.length > 0 || (results.textContent || "").trim().length > 0);

      // 继续触发（确保监听器已就绪）
      triggerSearch(input, q);

      if (hasResults || tries >= maxTries) {
        clearInterval(timer);
      }
    }, 100);
  }

  // DOM Ready 后执行（避免找不到 input）
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runWithRetry);
  } else {
    runWithRetry();
  }
})();
