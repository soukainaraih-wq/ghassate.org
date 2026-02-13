const staticRoutes = [
  { route: "", changefreq: "weekly", priority: "1.0" },
  { route: "about", changefreq: "monthly", priority: "0.8" },
  { route: "team", changefreq: "monthly", priority: "0.82" },
  { route: "projects", changefreq: "weekly", priority: "0.9" },
  { route: "news", changefreq: "daily", priority: "0.9" },
  { route: "integrity-charter", changefreq: "monthly", priority: "0.82" },
  { route: "membership", changefreq: "weekly", priority: "0.84" },
  { route: "privacy-policy", changefreq: "monthly", priority: "0.75" },
  { route: "contact", changefreq: "monthly", priority: "0.7" },
  { route: "donate", changefreq: "weekly", priority: "0.9" }
];
const supportedLangs = ["ar", "zgh", "en"];

function toDateOnly(value) {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toISOString().slice(0, 10);
}

function xmlEscape(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function buildAlternates(origin, route) {
  const suffix = route ? `/${route}` : "";
  return supportedLangs.map((lang) => `${origin}/${lang}${suffix}`);
}

function detectLangFromUrl(url) {
  for (const lang of supportedLangs) {
    if (url.includes(`/${lang}/`) || url.endsWith(`/${lang}`)) {
      return lang;
    }
  }

  return "ar";
}

function renderUrlNode({ loc, alternates = [], lastmod, changefreq, priority }) {
  const alternatesXml = alternates
    .map((item) => {
      const hreflang = detectLangFromUrl(item);
      return `\n    <xhtml:link rel="alternate" hreflang="${hreflang}" href="${xmlEscape(item)}" />`;
    })
    .join("");

  const defaultAlternate = alternates[0]
    ? `\n    <xhtml:link rel="alternate" hreflang="x-default" href="${xmlEscape(alternates[0])}" />`
    : "";

  return `
  <url>
    <loc>${xmlEscape(loc)}</loc>${alternatesXml}${defaultAlternate}${
    lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ""
  }${
    changefreq ? `\n    <changefreq>${changefreq}</changefreq>` : ""
  }${
    priority ? `\n    <priority>${priority}</priority>` : ""
  }
  </url>`;
}

export function buildSitemapXml({ origin, projects = [], news = [] }) {
  const nodes = [];

  for (const lang of supportedLangs) {
    for (const entry of staticRoutes) {
      const suffix = entry.route ? `/${entry.route}` : "";
      const loc = `${origin}/${lang}${suffix}`;
      nodes.push(
        renderUrlNode({
          loc,
          alternates: buildAlternates(origin, entry.route),
          changefreq: entry.changefreq,
          priority: entry.priority
        })
      );
    }
  }

  for (const project of projects) {
    const route = `projects/${project.slug}`;
    const lastmod = toDateOnly(project.updatedAt);

    for (const lang of supportedLangs) {
      nodes.push(
        renderUrlNode({
          loc: `${origin}/${lang}/${route}`,
          alternates: buildAlternates(origin, route),
          lastmod,
          changefreq: "weekly",
          priority: "0.75"
        })
      );
    }
  }

  for (const item of news) {
    const route = `news/${item.slug}`;
    const lastmod = toDateOnly(item.publishedAt);

    for (const lang of supportedLangs) {
      nodes.push(
        renderUrlNode({
          loc: `${origin}/${lang}/${route}`,
          alternates: buildAlternates(origin, route),
          lastmod,
          changefreq: "weekly",
          priority: "0.72"
        })
      );
    }
  }

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">${nodes.join("")}
</urlset>`;
}

export function buildRobotsTxt({ origin }) {
  return `User-agent: *
Allow: /

Sitemap: ${origin}/sitemap.xml
`;
}
