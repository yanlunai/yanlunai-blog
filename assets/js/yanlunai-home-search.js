(() => {
  const form = document.getElementById("yanlunai-home-search");
  const input = document.getElementById("yanlunai-home-search-input");

  const panel = document.getElementById("yanlunaiSearchPanel");
  const countEl = document.getElementById("yanlunaiSearchCount");
  const listEl = document.getElementById("yanlunaiSearchResults");
  const closeBtn = document.getElementById("yanlunaiSearchClose");

  if (!form || !input || !panel || !countEl || !listEl || !closeBtn) return;

  let fuse = null;
  let indexLoaded = false;
  let loading = false;

  function escapeHtml(s) {
    return String(s ?? "").replace(
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
  }

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
    if (indexLoaded || loading) return;
    loading = true;

    const res = await fetch("/index.json", { cache: "no-store" });
    if (!res.ok) {
      loading = false;
      throw new Error("index.json fetch failed: " + res.status);
    }

    const data = await res.json();
    fuse = new window.Fuse(data, {
      includeScore: true,
      shouldSort: true,
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 2,
      keys: [
        { name: "title", weight: 0.55 },
        { name: "summary", weight: 0.25 },
        { name: "content", weight: 0.15 },
        { name: "tags", weight: 0.03 },
        { name: "categories", weight: 0.02 },
      ],
    });

    indexLoaded = true;
    loading = false;
  }

  function hidePanel() {
    panel.hidden = true;
    countEl.textContent = "0";
    listEl.innerHTML = "";
  }

  function showPanel() {
    panel.hidden = false;
  }

  function renderEmpty(q) {
    countEl.textContent = "0";
    listEl.innerHTML = `
      <li class="yanlunai-search-empty">
        未找到与 <b>${escapeHtml(q)}</b> 相关的文章
      </li>
    `;
    showPanel();
  }

  function normalizeUrl(item) {
    return item?.permalink || item?.url || item?.relpermalink || "#";
  }

  function renderResults(found, q) {
    const top = found.slice(0, 10);
    countEl.textContent = String(found.length);

    if (!top.length) return renderEmpty(q);

    listEl.innerHTML = top
      .map(({ item }) => {
        const title = escapeHtml(item?.title || "");
        const url = normalizeUrl(item);
        const summary = escapeHtml(item?.summary || "").slice(0, 140);

        return `
        <li class="yanlunai-search-li" role="option">
          <a class="yanlunai-search-item" href="${url}">
            <div class="yanlunai-search-item-title">${title}</div>
            ${summary ? `<div class="yanlunai-search-item-summary">${summary}…</div>` : ""}
          </a>
        </li>
      `;
      })
      .join("");

    showPanel();
  }

  async function doSearch(raw) {
    const q = String(raw || "").trim();
    if (!q) return hidePanel();

    await ensureFuse();
    await ensureIndex();

    const found = fuse.search(q);
    renderResults(found, q);
  }

  // ✅ 跳转到 /search/?q=xxx（你要的最终形态）
  function gotoSearchPage(raw) {
    const q = String(raw || "").trim();
    if (!q) return;
    const url = "/search/?q=" + encodeURIComponent(q);
    window.location.assign(url);
  }

  // ============ 交互：输入即搜（下拉提示） ============
  let t = null;
  input.addEventListener("input", () => {
    clearTimeout(t);
    const q = input.value.trim();
    if (!q) return hidePanel();

    t = setTimeout(() => {
      doSearch(q).catch(() => {
        // 失败就静默收起，避免打扰
        hidePanel();
      });
    }, 120);
  });

  // ============ 关键：Enter/Submit -> 跳转 search 页 ============
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    gotoSearchPage(input.value);
  });

  // 兼容：有些输入法/移动端不会触发 form submit
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      gotoSearchPage(input.value);
      return;
    }

    if (e.key === "Escape") {
      hidePanel();
      input.blur();
    }
  });

  // 关闭按钮
  closeBtn.addEventListener("click", () => hidePanel());

  // 点击结果后收起（避免残留）
  listEl.addEventListener("click", (e) => {
    const a = e.target.closest("a");
    if (a) hidePanel();
  });

  // 点击面板外关闭（更工程化）
  document.addEventListener("mousedown", (e) => {
    if (panel.hidden) return;
    const inside = panel.contains(e.target) || form.contains(e.target);
    if (!inside) hidePanel();
  });

  // "/" 快捷聚焦（你页面提示里已写）
  document.addEventListener("keydown", (e) => {
    const tag = document.activeElement?.tagName || "";
    const isTyping = ["INPUT", "TEXTAREA"].includes(tag);
    if (e.key === "/" && !e.metaKey && !e.ctrlKey && !e.altKey && !isTyping) {
      e.preventDefault();
      input.focus();
    }
  });

  // 初始隐藏
  hidePanel();
})();
