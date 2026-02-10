(() => {
  // 仅在 /search 页面执行（兼容 /search 与 /xx/search）
  const path = window.location.pathname.replace(/\/+$/, "");
  const isSearchPage = path === "/search" || path.endsWith("/search");
  if (!isSearchPage) return;

  const input = document.getElementById("searchInput");
  const resultsEl = document.getElementById("searchResults");
  if (!input || !resultsEl) return;

  const params = new URLSearchParams(window.location.search);
  const initialQ = (params.get("q") || "").trim();

  // -------- utils ----------
  const escapeHtml = (s) =>
    String(s ?? "").replace(
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

  const normalizeUrl = (item) => item?.permalink || item?.url || item?.relpermalink || "#";

  const getSnippet = (item) => {
    const s = item?.summary || item?.content || "";
    const t = String(s).replace(/\s+/g, " ").trim();
    return t.length > 160 ? t.slice(0, 160) + "…" : t;
  };

  function renderEmpty(q) {
    resultsEl.innerHTML = `
      <div class="yl-sr-empty">
        未找到与 <b>${escapeHtml(q)}</b> 相关的文章
      </div>
    `;
  }

  function renderLoading() {
    resultsEl.innerHTML = `<div class="yl-sr-loading">正在加载索引…</div>`;
  }

  function renderError(msg) {
    resultsEl.innerHTML = `
      <div class="yl-sr-error">
        搜索初始化失败：${escapeHtml(msg)}
        <div style="opacity:.7;margin-top:8px;font-size:13px">
          你可以检查 <code>/index.json</code> 是否能打开，以及浏览器 Console 是否有报错。
        </div>
      </div>
    `;
  }

  function renderResults(found, q) {
    if (!found.length) return renderEmpty(q);

    const top = found.slice(0, 30); // search页可以多一些
    resultsEl.innerHTML = `
      <div class="yl-sr-meta">共 <b>${found.length}</b> 条结果</div>
      <div class="yl-sr-list">
        ${top
          .map(({ item }) => {
            const title = escapeHtml(item?.title || "(untitled)");
            const url = normalizeUrl(item);
            const snippet = escapeHtml(getSnippet(item));
            const tags = Array.isArray(item?.tags) ? item.tags : [];
            const cats = Array.isArray(item?.categories) ? item.categories : [];

            const chips = [...cats.slice(0, 2), ...tags.slice(0, 3)]
              .filter(Boolean)
              .map((x) => `<span class="yl-sr-chip">${escapeHtml(x)}</span>`)
              .join("");

            return `
            <a class="yl-sr-item" href="${url}">
              <div class="yl-sr-title">${title}</div>
              ${chips ? `<div class="yl-sr-chips">${chips}</div>` : ""}
              ${snippet ? `<div class="yl-sr-snippet">${snippet}</div>` : ""}
            </a>
          `;
          })
          .join("")}
      </div>
    `;
  }

  // -------- search core ----------
  let fuse = null;
  let indexLoaded = false;
  let dataCache = null;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function ensureFuse() {
    if (window.Fuse) return;
    await loadScript("https://cdn.jsdelivr.net/npm/fuse.js@6.6.2");
  }

  async function ensureIndex() {
    if (indexLoaded && dataCache) return;
    renderLoading();

    // 关键：确保用同源绝对路径，避免 baseURL / 子路径问题
    const res = await fetch("/index.json", { cache: "no-store" });
    if (!res.ok) throw new Error("index.json fetch failed: " + res.status);

    const data = await res.json();
    dataCache = Array.isArray(data) ? data : [];

    fuse = new window.Fuse(dataCache, {
      includeScore: true,
      shouldSort: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "title", weight: 0.6 },
        { name: "summary", weight: 0.25 },
        { name: "content", weight: 0.12 },
        { name: "tags", weight: 0.02 },
        { name: "categories", weight: 0.01 },
      ],
    });

    indexLoaded = true;
  }

  async function doSearch(raw) {
    const q = String(raw || "").trim();
    if (!q) {
      resultsEl.innerHTML = "";
      return;
    }

    await ensureFuse();
    await ensureIndex();

    const found = fuse.search(q);
    renderResults(found, q);
  }

  // -------- behavior ----------
  // 1) 首次：回填 + 触发搜索（不用等“空格”）
  function initFromQuery() {
    if (!initialQ) return;
    input.value = initialQ;

    // 立即搜索 + 再补一枪（处理某些浏览器/脚本初始化慢）
    doSearch(initialQ).catch((e) => renderError(e.message || String(e)));
    setTimeout(() => doSearch(initialQ).catch(() => {}), 250);
  }

  // 2) 输入即搜（防抖）
  let t = null;
  input.addEventListener("input", () => {
    clearTimeout(t);
    const v = input.value;
    t = setTimeout(() => {
      // 同步更新 URL（便于分享）
      const url = new URL(window.location.href);
      url.searchParams.set("q", v.trim());
      window.history.replaceState({}, "", url.toString());

      doSearch(v).catch((e) => renderError(e.message || String(e)));
    }, 120);
  });

  // 3) 回车也触发（可选）
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      doSearch(input.value).catch((err) => renderError(err.message || String(err)));
    }
  });

  // 启动
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initFromQuery);
  } else {
    initFromQuery();
  }
})();
