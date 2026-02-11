(() => {
  // only /search/
  if (location.pathname.replace(/\/+$/, "/") !== "/search/") return;

  const input = document.getElementById("searchInput");
  const results = document.getElementById("searchResults");
  const countEl = document.getElementById("searchCount");
  if (!input || !results) return;

  // 1) kill theme handlers (must fix your contains-null crash)
  const kill = (e) => e.stopImmediatePropagation();
  document.addEventListener("keydown", kill, true);
  input.addEventListener("input", kill, true);
  try {
    document.onkeydown = null;
  } catch (_) {}

  // 2) load index.json (your fields: title/summary/content/permalink)
  let DATA = [];
  async function loadIndex() {
    const res = await fetch("/index.json", { cache: "no-store" });
    if (!res.ok) throw new Error("index.json load failed: " + res.status);
    const json = await res.json();
    DATA = (json || [])
      .map((it) => ({
        title: it.title || "",
        summary: it.summary || it.description || "",
        content: it.content || "",
        permalink: it.permalink || it.url || "",
      }))
      .filter((x) => x.permalink);
  }

  const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

  function score(item, q) {
    const qq = q.toLowerCase();
    const t = item.title.toLowerCase();
    const b = (item.summary + " " + item.content).toLowerCase();
    let s = 0;
    if (t.includes(qq)) s += 10;
    if (b.includes(qq)) s += 3;
    return s;
  }

  function snippet(item, q) {
    const text = (item.summary || item.content || "").replace(/\s+/g, " ").trim();
    if (!text) return "";
    const qq = q.toLowerCase();
    const idx = text.toLowerCase().indexOf(qq);
    if (idx < 0) return text.slice(0, 140);
    const start = Math.max(0, idx - 40);
    const end = Math.min(text.length, idx + qq.length + 80);
    return (start ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
  }

  function render(q) {
    const query = (q || "").trim();
    results.innerHTML = "";
    if (!query) {
      if (countEl) countEl.textContent = "";
      return;
    }

    const matched = DATA.map((it) => ({ it, s: score(it, query) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .map((x) => x.it);

    if (countEl) countEl.textContent = `共 ${matched.length} 条结果`;

    if (!matched.length) {
      const li = document.createElement("li");
      li.className = "search-empty";
      li.textContent = "没有找到相关内容。";
      results.appendChild(li);
      return;
    }

    const frag = document.createDocumentFragment();
    for (const item of matched.slice(0, 50)) {
      const li = document.createElement("li");
      li.className = "search-result";
      li.innerHTML = `
        <a href="${esc(item.permalink)}">
          <div class="search-title">${esc(item.title)}</div>
          <p class="search-snippet">${esc(snippet(item, query))}</p>
        </a>
      `;
      frag.appendChild(li);
    }
    results.appendChild(frag);
  }

  function syncUrl(q) {
    const u = new URL(location.href);
    q ? u.searchParams.set("q", q) : u.searchParams.delete("q");
    history.replaceState(null, "", u.toString());
  }

  let timer = null;
  function onInput() {
    const q = input.value || "";
    syncUrl(q);
    clearTimeout(timer);
    timer = setTimeout(() => render(q), 60);
  }

  input.addEventListener(
    "keydown",
    (e) => {
      if (e.key === "Enter") e.preventDefault();
    },
    true
  );

  input.addEventListener("input", onInput, true);

  window.addEventListener("popstate", () => {
    const q = new URLSearchParams(location.search).get("q") || "";
    input.value = q;
    render(q);
  });

  (async () => {
    await loadIndex();
    const q = new URLSearchParams(location.search).get("q") || "";
    input.value = q;
    render(q); // ✅ 关键：打开 /search/?q=rag 立即有列表
    input.focus();
  })();
})();
