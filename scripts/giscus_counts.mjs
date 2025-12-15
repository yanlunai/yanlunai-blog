import fs from "fs";
import path from "path";

const OWNER = "yanlunai";
const REPO = "yanlunai-blog";

// 你的 giscus category（可不需要）
const CATEGORY = "Comments";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
if (!GITHUB_TOKEN) {
  console.error("Missing GITHUB_TOKEN");
  process.exit(1);
}

// 读取 Hugo 生成的 public/sitemap.xml，提取文章 URL
function extractUrlsFromSitemap(sitemapPath) {
  const xml = fs.readFileSync(sitemapPath, "utf8");
  const urls = [...xml.matchAll(/<loc>(.*?)<\/loc>/g)].map((m) => m[1]);
  // 只保留 posts（按你站点实际路由改）
  return urls.filter((u) => u.includes("/posts/"));
}

// GitHub GraphQL 请求
async function gql(query, variables) {
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (json.errors) {
    console.error(JSON.stringify(json.errors, null, 2));
    throw new Error("GraphQL error");
  }
  return json.data;
}

// 通过 discussion 的 title=pathname（最接近 giscus 的默认策略）
// 你的 mapping=pathname，所以 Discussion 标题通常就是 pathname（例如 /yanlunai-blog/posts/xxx/ 或 /posts/xxx/）
// ⚠️ 不同站点可能包含 baseURL path 前缀：你现在是 /yanlunai-blog/...
function urlToPathname(url) {
  const u = new URL(url);
  return u.pathname; // e.g. /yanlunai-blog/posts/demo/
}

const SEARCH_QUERY = `
query($q:String!) {
  search(type: DISCUSSION, query: $q, first: 1) {
    nodes {
      ... on Discussion {
        title
        url
        comments { totalCount }
      }
    }
  }
}
`;

async function main() {
  const sitemapPath = path.join("public", "sitemap.xml");
  if (!fs.existsSync(sitemapPath)) {
    console.error("public/sitemap.xml not found. Run hugo first.");
    process.exit(1);
  }

  const urls = extractUrlsFromSitemap(sitemapPath);
  const out = {};

  for (const url of urls) {
    const pathname = urlToPathname(url);

    // GitHub 搜索：repo 限定 + title 精确匹配（用引号）
    const q = `repo:${OWNER}/${REPO} in:title "${pathname}"`;
    try {
      const data = await gql(SEARCH_QUERY, { q });
      const node = data.search.nodes?.[0];
      out[pathname] = node?.comments?.totalCount ?? 0;
    } catch (e) {
      out[pathname] = 0;
      console.error("Failed:", pathname, e.message);
    }
  }

  fs.mkdirSync(path.join("static"), { recursive: true });
  fs.writeFileSync(path.join("static", "comments-count.json"), JSON.stringify(out, null, 2));
  console.log("Wrote static/comments-count.json with", Object.keys(out).length, "items");
}

main();
