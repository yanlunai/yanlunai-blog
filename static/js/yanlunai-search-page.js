(() => {
  // 只允许在 /search/ 页面运行（兼容末尾 /）
  const path = location.pathname.replace(/\/+$/, "/");
  if (path !== "/search/") return;

  const input0 = document.getElementById("searchInput");
  const results0 = document.getElementById("searchResults");
  const countEl = document.getElementById("searchCount");
  if (!input0 || !results0 || !countEl) return;

  // ✅ 核心：替换节点，彻底清空主题 search.js 绑在老节点上的监听器
  const input = input0.cloneNode(true);
  input0.parentNode.replaceChild(input, input0);

  const resultsEl = results0.cloneNode(false); // 空 UL
  results0.parentNode.replaceChild(resultsEl, results0);

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

  const debounce = (fn, wait = 80) => {
    let t = null;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  };

  function normalizeIndexItem(x) {
    return {
      title: x.title || "",
      summary: x.summary || x.description || "",
      content: x.content || "",
      permalink: x.permalink || x.url || "",
    };
  }

  async function loadIndex() {
    try {
      const res = await fetch(`${INDEX_URL}?v=${Date.now()}`, { cache: "no-store" });
      if (!res.ok) throw new Error(`fetch index.json failed: ${res.status}`);
      const data = await res.json();
      if (!Array.isArray(data)) throw new Error("index.json is not an array");
      indexData = data.map(normalizeIndexItem).filter((x) => x.permalink);
      indexReady = true;
    } catch (e) {
      indexReady = false;
      console.error(e);
      countEl.textContent = "索引加载失败（/index.json）";
      resultsEl.innerHTML = `<li class="search-empty">无法加载 /index.json，请确认站点根目录存在该文件。</li>`;
    }
  }

  function scoreItem(item, qLower) {
    const t = item.title.toLowerCase();
    const s = item.summary.toLowerCase();
    const c = item.content.toLowerCase();

    let score = 0;
    if (t.includes(qLower)) score += 50;
    if (s.includes(qLower)) score += 12;
    if (c.includes(qLower)) score += 3;
    return score;
  }

  function makeSnippet(item, qLower) {
    const raw = (item.summary || item.content || "").replace(/\s+/g, " ").trim();
    if (!raw) return "";
    const idx = raw.toLowerCase().indexOf(qLower);
    if (idx < 0) return raw.slice(0, 140);
    const start = Math.max(0, idx - 40);
    const end = Math.min(raw.length, idx + qLower.length + 90);
    return (start ? "…" : "") + raw.slice(start, end) + (end < raw.length ? "…" : "");
  }

  function render(q) {
    if (!indexReady) return;

    const query = (q || "").trim();
    resultsEl.innerHTML = "";
    if (!query) {
      countEl.textContent = "";
      return;
    }

    const qLower = query.toLowerCase();

    const hits = indexData
      .map((it) => ({ it, s: scoreItem(it, qLower) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 50)
      .map((x) => x.it);

    countEl.textContent = `共 ${hits.length} 条结果`;

    if (!hits.length) {
      resultsEl.innerHTML = `<li class="search-empty">没有找到与 “${esc(query)}” 相关的内容</li>`;
      return;
    }

    const frag = document.createDocumentFragment();
    for (const h of hits) {
      const li = document.createElement("li");
      li.className = "search-result";
      li.innerHTML = `
        <a href="${esc(h.permalink)}">
          <div class="search-title">${esc(h.title || "(untitled)")}</div>
          <p class="search-snippet">${esc(makeSnippet(h, qLower))}</p>
        </a>
      `;
      frag.appendChild(li);
    }
    resultsEl.appendChild(frag);
  }

  const onInput = debounce(() => {
    const q = input.value || "";
    setQ(q);
    render(q);
  }, 80);

  // ✅ 输入即搜
  input.addEventListener("input", onInput);

  // ✅ 回车不刷新页面（但也能触发一次 render，兼容习惯）
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const q = input.value || "";
      setQ(q);
      render(q);
    }
  });

  // ✅ 浏览器前进后退
  window.addEventListener("popstate", () => {
    const q = getQ();
    input.value = q;
    render(q);
  });

  // init
  (async () => {
    await loadIndex();
    const q = getQ();
    input.value = q;
    render(q); // ✅ 打开 /search/?q=rag 立即渲染卡片
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
  })();
})();
