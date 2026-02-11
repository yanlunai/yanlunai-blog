(() => {
  // 只允许在 /search/ 页面运行
  if (location.pathname !== "/search/" && !document.querySelector(".page-search")) return;

  const input = document.getElementById("searchInput");
  const resultsEl = document.getElementById("searchResults");
  const countEl = document.getElementById("searchCount");

  if (!input || !resultsEl || !countEl) return;

  const INDEX_URL = "/index.json";
  let indexData = [];
  let indexReady = false;

  // --- utils ---
  const esc = (s) =>
    String(s).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        }[c])
    );

  const getQ = () => new URLSearchParams(location.search).get("q") || "";

  const setQ = (q) => {
    const url = new URL(location.href);
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    history.replaceState(null, "", url.toString());
  };

  const debounce = (fn, wait = 120) => {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  // --- load index.json ---
  async function loadIndex() {
    try {
      // cache bust：避免 CDN/浏览器缓存旧 index
      const url = `${INDEX_URL}?v=${Date.now()}`;
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error(`fetch index.json failed: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("index.json is not an array");

      // 只保留我们需要的字段
      indexData = data.map((x) => ({
        title: x.title || "",
        summary: x.summary || "",
        content: x.content || "",
        permalink: x.permalink || "",
      }));
      indexReady = true;
    } catch (e) {
      indexReady = false;
      countEl.textContent = "索引加载失败（index.json）";
      resultsEl.innerHTML = `<li class="search-empty">无法加载 index.json，请检查站点根目录是否存在 /index.json</li>`;
      // console for debugging
      console.error(e);
    }
  }

  // --- search + render ---
  function searchLocal(q) {
    const query = q.trim().toLowerCase();
    if (!query) return [];

    // 简单但非常稳定：title > summary > content
    // 你后续想上 Fuse 再加也行，但先把“稳定输入即搜”跑通
    const scored = [];

    for (const item of indexData) {
      const t = item.title.toLowerCase();
      const s = item.summary.toLowerCase();
      const c = item.content.toLowerCase();

      let score = 0;
      if (t.includes(query)) score += 30;
      if (s.includes(query)) score += 10;
      if (c.includes(query)) score += 3;

      if (score > 0) {
        scored.push({ ...item, _score: score });
      }
    }

    scored.sort((a, b) => b._score - a._score);
    return scored.slice(0, 30);
  }

  function render(q) {
    if (!indexReady) return;

    const query = q.trim();
    if (!query) {
      countEl.textContent = "";
      resultsEl.innerHTML = "";
      return;
    }

    const hits = searchLocal(query);

    countEl.textContent = hits.length ? `共 ${hits.length} 条结果` : "无结果";

    if (!hits.length) {
      resultsEl.innerHTML = `<li class="search-empty">没有找到与 “${esc(query)}” 相关的内容</li>`;
      return;
    }

    resultsEl.innerHTML = hits
      .map((h) => {
        const title = esc(h.title || "(untitled)");
        const snippetSrc = (h.summary || h.content || "").trim();
        const snippet = esc(snippetSrc.slice(0, 120));
        const url = esc(h.permalink || "#");

        return `
<li class="search-result">
  <a href="${url}">
    <div class="search-title">${title}</div>
    <p class="search-snippet">${snippet}</p>
  </a>
</li>`;
      })
      .join("");
  }

  const renderDebounced = debounce((q) => {
    setQ(q);
    render(q);
  }, 120);

  // --- events ---
  // 输入即搜：核心就在这里
  input.addEventListener("input", () => {
    renderDebounced(input.value);
  });

  // 回车也能搜（兼容你的“按回车才出结果”的习惯）
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      setQ(input.value);
      render(input.value);
    }
  });

  // 初始化：读取 URL 的 q，并立即渲染一次
  (async () => {
    await loadIndex();

    const q = getQ();
    input.value = q;

    // ✅ 关键：不依赖回车，初始化直接渲染
    render(q);

    // 聚焦体验
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  })();
})();
