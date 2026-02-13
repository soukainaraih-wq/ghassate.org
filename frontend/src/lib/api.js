import { STATIC_MODE } from "./runtime-config";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "/api";
const SUPPORTED_LANGS = new Set(["ar", "zgh", "en"]);
let staticStorePromise = null;

function normalizeLang(value) {
  const candidate = String(value || "").trim().toLowerCase();
  return SUPPORTED_LANGS.has(candidate) ? candidate : "ar";
}

function pickLocalized(map, lang) {
  return map?.[lang] || map?.ar || map?.zgh || map?.en || "";
}

function pickLocalizedList(map, lang) {
  const value = map?.[lang] || map?.ar || map?.zgh || map?.en || [];
  return Array.isArray(value) ? value : [];
}

function formatDate(value, lang) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const locale = lang === "en" ? "en-US" : "ar-MA";
  return parsed.toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

function parseBody(body) {
  if (!body) {
    return {};
  }

  if (typeof body === "string") {
    try {
      const parsed = JSON.parse(body);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof body === "object" ? body : {};
}

function mapProjectByLang(project, lang) {
  return {
    id: project.id,
    slug: project.slug,
    category: pickLocalized(project.category, lang),
    title: pickLocalized(project.title, lang),
    excerpt: pickLocalized(project.excerpt, lang),
    status: pickLocalized(project.status, lang),
    budget: pickLocalized(project.budget, lang),
    beneficiaries: pickLocalized(project.beneficiaries, lang),
    implementationArea: pickLocalized(project.implementationArea, lang),
    timeline: pickLocalized(project.timeline, lang),
    objectives: pickLocalizedList(project.objectives, lang),
    outcomes: pickLocalizedList(project.outcomes, lang),
    partners: pickLocalizedList(project.partners, lang),
    updatedAt: formatDate(project.updatedAt, lang),
    updatedAtIso: project.updatedAt
  };
}

function mapNewsByLang(item, lang) {
  return {
    id: item.id,
    slug: item.slug,
    title: pickLocalized(item.title, lang),
    excerpt: pickLocalized(item.excerpt, lang),
    content: pickLocalizedList(item.content, lang),
    keyPoints: pickLocalizedList(item.keyPoints, lang),
    author: pickLocalized(item.author, lang),
    publishedAt: formatDate(item.publishedAt, lang),
    publishedAtIso: item.publishedAt
  };
}

function mapPageByLang(item, lang) {
  return {
    id: item.id,
    slug: item.slug,
    title: pickLocalized(item.title, lang),
    excerpt: pickLocalized(item.excerpt, lang),
    content: pickLocalizedList(item.content, lang),
    status: String(item.status || "published").toLowerCase(),
    publishedAt: formatDate(item.publishedAt, lang),
    publishedAtIso: item.publishedAt,
    updatedAtIso: item.updatedAt
  };
}

function mapSettingsByLang(settings, lang) {
  const normalizedLang = normalizeLang(lang);

  return {
    hero: {
      title: settings?.hero?.title?.[normalizedLang] || settings?.hero?.title?.ar || "",
      text: settings?.hero?.text?.[normalizedLang] || settings?.hero?.text?.ar || "",
      badge: settings?.hero?.badge?.[normalizedLang] || settings?.hero?.badge?.ar || ""
    },
    contact: {
      email: settings?.contact?.email || "",
      phone: settings?.contact?.phone || "",
      address:
        settings?.contact?.address?.[normalizedLang] ||
        settings?.contact?.address?.ar ||
        settings?.contact?.address?.en ||
        ""
    },
    social: {
      facebook: settings?.social?.facebook || "",
      instagram: settings?.social?.instagram || "",
      linkedin: settings?.social?.linkedin || "",
      youtube: settings?.social?.youtube || ""
    },
    donation: {
      beneficiary: settings?.donation?.beneficiary || "",
      iban: settings?.donation?.iban || "",
      bic: settings?.donation?.bic || ""
    },
    legal: {
      updatedAt: settings?.legal?.updatedAt || "",
      registrationNumber: settings?.legal?.registrationNumber || "",
      taxReference: settings?.legal?.taxReference || ""
    }
  };
}

async function loadStaticStore() {
  if (!staticStorePromise) {
    staticStorePromise = fetch("/cms-store.json", {
      cache: "no-store"
    }).then(async (response) => {
      if (!response.ok) {
        throw new Error("Static CMS store is unavailable.");
      }

      const data = await response.json();
      return data && typeof data === "object" ? data : {};
    });
  }

  return staticStorePromise;
}

async function resolveStaticResponse(path, options = {}, allowWriteFallback = false) {
  const method = String(options.method || "GET").toUpperCase();
  const parsedPath = new URL(path, "https://ghassate.local");
  const payload = parseBody(options.body);
  const lang = normalizeLang(parsedPath.searchParams.get("lang") || payload.lang);
  const pathname = parsedPath.pathname;

  if (pathname.startsWith("/admin/")) {
    if (STATIC_MODE) {
      throw new Error("Dashboard is disabled in static deployment mode.");
    }
    return undefined;
  }

  if (pathname === "/contact" && method === "POST") {
    if (!allowWriteFallback) {
      return undefined;
    }

    return {
      message: "Message accepted in static mode.",
      id: Date.now()
    };
  }

  if (pathname === "/newsletter" && method === "POST") {
    if (!allowWriteFallback) {
      return undefined;
    }

    return {
      message: "Subscription accepted in static mode.",
      id: Date.now()
    };
  }

  if (method !== "GET") {
    return undefined;
  }

  const store = await loadStaticStore();
  const projects = Array.isArray(store.projects) ? store.projects : [];
  const news = Array.isArray(store.news) ? store.news : [];
  const pages = Array.isArray(store.pages) ? store.pages : [];
  const impact = store.impact && typeof store.impact === "object" ? store.impact : {};

  if (pathname === "/projects") {
    return {
      lang,
      total: projects.length,
      items: projects.map((project) => mapProjectByLang(project, lang))
    };
  }

  if (pathname.startsWith("/projects/")) {
    const slug = decodeURIComponent(pathname.slice("/projects/".length));
    const project = projects.find((item) => item.slug === slug);
    if (!project) {
      throw new Error("Project not found.");
    }
    return mapProjectByLang(project, lang);
  }

  if (pathname === "/news") {
    return {
      lang,
      total: news.length,
      items: news.map((item) => mapNewsByLang(item, lang))
    };
  }

  if (pathname.startsWith("/news/")) {
    const slug = decodeURIComponent(pathname.slice("/news/".length));
    const item = news.find((entry) => entry.slug === slug);
    if (!item) {
      throw new Error("News item not found.");
    }
    return mapNewsByLang(item, lang);
  }

  if (pathname === "/pages") {
    const publishedPages = pages.filter((item) => String(item?.status || "published").toLowerCase() === "published");
    return {
      lang,
      total: publishedPages.length,
      items: publishedPages.map((item) => mapPageByLang(item, lang))
    };
  }

  if (pathname.startsWith("/pages/")) {
    const slug = decodeURIComponent(pathname.slice("/pages/".length));
    const page = pages.find(
      (entry) => entry.slug === slug && String(entry.status || "published").toLowerCase() === "published"
    );
    if (!page) {
      throw new Error("Page not found.");
    }
    return mapPageByLang(page, lang);
  }

  if (pathname === "/impact") {
    return {
      lang,
      items: impact[lang] || impact.ar || []
    };
  }

  if (pathname === "/settings") {
    return {
      lang,
      settings: mapSettingsByLang(store.settings, lang),
      updatedAt: store.updatedAt || ""
    };
  }

  return undefined;
}

async function request(path, options = {}) {
  const method = String(options.method || "GET").toUpperCase();

  if (STATIC_MODE) {
    const staticResponse = await resolveStaticResponse(path, options, true);
    if (staticResponse !== undefined) {
      return staticResponse;
    }
  }

  const headers = {
    ...(options.headers || {})
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers,
      credentials: "omit",
      redirect: "error",
      cache: "no-store",
      ...options
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      if (method === "GET") {
        const staticResponse = await resolveStaticResponse(path, options, false);
        if (staticResponse !== undefined) {
          return staticResponse;
        }
      }

      const message = data?.message || "Request failed";
      throw new Error(message);
    }

    return data;
  } catch (error) {
    if (method === "GET") {
      const staticResponse = await resolveStaticResponse(path, options, false);
      if (staticResponse !== undefined) {
        return staticResponse;
      }
    }

    throw error;
  }
}

export function getProjects(lang) {
  return request(`/projects?lang=${lang}`);
}

export function getProjectBySlug(lang, slug) {
  return request(`/projects/${slug}?lang=${lang}`);
}

export function getNews(lang) {
  return request(`/news?lang=${lang}`);
}

export function getNewsBySlug(lang, slug) {
  return request(`/news/${slug}?lang=${lang}`);
}

export function getPages(lang) {
  return request(`/pages?lang=${lang}`);
}

export function getPageBySlug(lang, slug) {
  return request(`/pages/${slug}?lang=${lang}`);
}

export function getImpact(lang) {
  return request(`/impact?lang=${lang}`);
}

export function getSiteSettings(lang) {
  return request(`/settings?lang=${lang}`);
}

export function sendContact(payload) {
  return request("/contact", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function subscribeNewsletter(payload) {
  return request("/newsletter", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function adminLogin(email, password) {
  return request("/admin/login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

function requireAdminToken(token) {
  const normalized = String(token || "").trim();
  if (!normalized) {
    throw new Error("Admin token is required.");
  }

  return normalized;
}

function adminRequest(path, token, options = {}) {
  const securedToken = requireAdminToken(token);
  return request(path, {
    ...options,
    headers: {
      "Authorization": `Bearer ${securedToken}`,
      ...(options.headers || {})
    }
  });
}

export function getAdminCms(token) {
  return adminRequest("/admin/cms", token);
}

export function getAdminSummary(token) {
  return adminRequest("/admin/summary", token);
}

export function updateAdminSettings(token, payload) {
  return adminRequest("/admin/settings", token, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function createAdminProject(token, payload) {
  return adminRequest("/admin/projects", token, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminProject(token, id, payload) {
  return adminRequest(`/admin/projects/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminProject(token, id) {
  return adminRequest(`/admin/projects/${id}`, token, {
    method: "DELETE"
  });
}

export function createAdminNews(token, payload) {
  return adminRequest("/admin/news", token, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminNews(token, id, payload) {
  return adminRequest(`/admin/news/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminNews(token, id) {
  return adminRequest(`/admin/news/${id}`, token, {
    method: "DELETE"
  });
}

export function createAdminPage(token, payload) {
  return adminRequest("/admin/pages", token, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminPage(token, id, payload) {
  return adminRequest(`/admin/pages/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminPage(token, id) {
  return adminRequest(`/admin/pages/${id}`, token, {
    method: "DELETE"
  });
}

export function createAdminMedia(token, payload) {
  return adminRequest("/admin/media", token, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function updateAdminMedia(token, id, payload) {
  return adminRequest(`/admin/media/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export function deleteAdminMedia(token, id) {
  return adminRequest(`/admin/media/${id}`, token, {
    method: "DELETE"
  });
}
