import crypto from "node:crypto";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { impact } from "./data/impact.js";
import { mapNewsByLang, news } from "./data/news.js";
import { mapProjectByLang, projects } from "./data/projects.js";
import { getCmsStore, initializeCmsStore, updateCmsStore } from "./utils/cms-store.js";
import { buildRobotsTxt, buildSitemapXml } from "./utils/seo.js";
import {
  isValidSlug,
  normalizeLang,
  normalizeText,
  validateContactInput,
  validateNewsletterInput
} from "./utils/validation.js";

const app = express();
const blockedObjectKeys = new Set(["__proto__", "prototype", "constructor"]);
const allowedApiMethods = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"]);
const adminMediaTypes = new Set(["image", "video", "document", "audio"]);
const localizedKeys = ["ar", "zgh", "en"];

function toNumber(value, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

function normalizeOrigin(value) {
  return String(value || "").trim().replace(/\/+$/, "");
}

function resolveTrustProxy(value) {
  const raw = String(value || "").trim();
  if (!raw || raw === "false") {
    return false;
  }

  if (raw === "true") {
    return true;
  }

  if (/^\d+$/.test(raw)) {
    return toNumber(raw, 1, 0, 32);
  }

  return raw;
}

const NODE_ENV = process.env.NODE_ENV || "development";
const IS_PROD = NODE_ENV === "production";
const PORT = toNumber(process.env.PORT, 8108, 1, 65535);
const FRONTEND_PORT = toNumber(process.env.FRONTEND_PORT, 5151, 1, 65535);
const FRONTEND_ORIGIN = normalizeOrigin(
  process.env.FRONTEND_ORIGIN || `http://localhost:${FRONTEND_PORT}`
);
const PUBLIC_ORIGIN = normalizeOrigin(process.env.PUBLIC_ORIGIN || "https://ghassate.org");
const ADMIN_TOKEN = String(process.env.ADMIN_TOKEN || "");
const ALLOW_NO_ORIGIN = process.env.ALLOW_NO_ORIGIN === "true";
const RATE_WINDOW_MS = toNumber(process.env.RATE_WINDOW_MS, 60_000, 10_000, 300_000);
const GENERIC_RATE_LIMIT = toNumber(process.env.GENERIC_RATE_LIMIT, 120, 20, 5000);
const CONTACT_RATE_LIMIT = toNumber(process.env.CONTACT_RATE_LIMIT, 7, 2, 200);
const NEWSLETTER_RATE_LIMIT = toNumber(process.env.NEWSLETTER_RATE_LIMIT, 10, 2, 200);
const ADMIN_RATE_LIMIT = toNumber(process.env.ADMIN_RATE_LIMIT, 15, 3, 300);
const MAX_RATE_TRACKED_KEYS = toNumber(process.env.MAX_RATE_TRACKED_KEYS, 20_000, 1000, 200_000);
const MAX_STORED_RECORDS = toNumber(process.env.MAX_STORED_RECORDS, 1000, 100, 100_000);
const MAX_JSON_BODY_BYTES = toNumber(process.env.MAX_JSON_BODY_BYTES, 120 * 1024, 2048, 1024 * 1024);
const MAX_URL_LENGTH = toNumber(process.env.MAX_URL_LENGTH, 2048, 256, 8192);
const TRUST_PROXY = resolveTrustProxy(process.env.TRUST_PROXY);
const ENABLE_ADMIN_ENDPOINT = process.env.ENABLE_ADMIN_ENDPOINT === "true";
const MIN_ADMIN_TOKEN_LENGTH = 32;
const ADMIN_DASHBOARD_ENABLED = ENABLE_ADMIN_ENDPOINT || !IS_PROD;
const EFFECTIVE_ADMIN_TOKEN = !IS_PROD && !ADMIN_TOKEN ? "local-dev-admin-token" : ADMIN_TOKEN;

const extraOrigins = String(process.env.FRONTEND_EXTRA_ORIGINS || "")
  .split(",")
  .map((item) => normalizeOrigin(item))
  .filter(Boolean);

const allowedOrigins = new Set([
  FRONTEND_ORIGIN,
  `http://127.0.0.1:${FRONTEND_PORT}`,
  PUBLIC_ORIGIN,
  ...extraOrigins
]);

const contactSubmissions = [];
const newsletterSubscribers = [];
const apiRateStore = new Map();
const contactRateStore = new Map();
const newsletterRateStore = new Map();
const adminRateStore = new Map();

await initializeCmsStore({ projects, news, impact });

function textByLang(lang, ar, zgh, en) {
  if (lang === "en") {
    return en;
  }

  if (lang === "zgh") {
    return zgh || ar;
  }

  return ar;
}

function getRequestLang(req) {
  return normalizeLang(req.body?.lang || req.query?.lang);
}

function isReadOnlyMethod(method) {
  return method === "GET" || method === "HEAD" || method === "OPTIONS";
}

function safeCompare(valueA, valueB) {
  const a = Buffer.from(String(valueA || ""));
  const b = Buffer.from(String(valueB || ""));

  if (a.length !== b.length) {
    return false;
  }

  return crypto.timingSafeEqual(a, b);
}

function getClientIp(req) {
  const ip = typeof req.ip === "string" && req.ip.trim() ? req.ip.trim() : "";
  if (ip) {
    return ip;
  }

  const fallback =
    typeof req.socket?.remoteAddress === "string" ? req.socket.remoteAddress.trim() : "";
  return fallback || "unknown";
}

function getClientKey(req) {
  return getClientIp(req);
}

function applyRateLimit(store, key, limit, windowMs) {
  const now = Date.now();
  const existing = store.get(key);
  const initialState = !existing || now >= existing.resetAt;
  const entry = initialState
    ? {
        count: 0,
        resetAt: now + windowMs
      }
    : existing;

  entry.count += 1;
  store.set(key, entry);
  enforceRateStoreCap(store, MAX_RATE_TRACKED_KEYS);

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetSeconds: Math.max(0, Math.ceil((entry.resetAt - now) / 1000))
  };
}

function enforceRateStoreCap(store, maxEntries) {
  if (store.size <= maxEntries) {
    return;
  }

  cleanupRateStore(store);

  while (store.size > maxEntries) {
    const oldestKey = store.keys().next().value;
    if (!oldestKey) {
      break;
    }

    store.delete(oldestKey);
  }
}

function cleanupRateStore(store) {
  const now = Date.now();

  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

function setRateHeaders(res, info, limit, prefix = "RateLimit") {
  res.setHeader(`${prefix}-Limit`, limit);
  res.setHeader(`${prefix}-Remaining`, info.remaining);
  res.setHeader(`${prefix}-Reset`, info.resetSeconds);
}

function trimStoredRecords(list) {
  while (list.length > MAX_STORED_RECORDS) {
    list.shift();
  }
}

function parseOriginFromReferer(referer) {
  if (!referer || typeof referer !== "string") {
    return "";
  }

  try {
    return normalizeOrigin(new URL(referer).origin);
  } catch {
    return "";
  }
}

function toIsoDate(value, fallback = new Date().toISOString().slice(0, 10)) {
  const parsed = new Date(value || "");
  if (Number.isNaN(parsed.getTime())) {
    return fallback;
  }

  return parsed.toISOString().slice(0, 10);
}

function sanitizeUrl(value) {
  const normalized = normalizeText(value);
  if (!normalized) {
    return "";
  }

  try {
    const parsed = new URL(normalized);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function sanitizeLocalizedTextMap(value, maxLength = 240) {
  const source = value && typeof value === "object" ? value : {};

  return {
    ar: normalizeText(source.ar).slice(0, maxLength),
    zgh: normalizeText(source.zgh).slice(0, maxLength),
    en: normalizeText(source.en).slice(0, maxLength)
  };
}

function sanitizeList(value, maxItems = 10, maxLength = 220) {
  if (Array.isArray(value)) {
    return value
      .map((item) => normalizeText(item).slice(0, maxLength))
      .filter(Boolean)
      .slice(0, maxItems);
  }

  if (typeof value === "string") {
    return value
      .split("\n")
      .map((item) => normalizeText(item).slice(0, maxLength))
      .filter(Boolean)
      .slice(0, maxItems);
  }

  return [];
}

function sanitizeLocalizedListMap(value, maxItems = 10, maxLength = 220) {
  const source = value && typeof value === "object" ? value : {};
  return {
    ar: sanitizeList(source.ar, maxItems, maxLength),
    zgh: sanitizeList(source.zgh, maxItems, maxLength),
    en: sanitizeList(source.en, maxItems, maxLength)
  };
}

function hasLocalizedValue(map) {
  if (!map || typeof map !== "object") {
    return false;
  }

  return localizedKeys.some((key) => normalizeText(map[key]).length > 0);
}

function createSlugFromText(value) {
  const cleaned = normalizeText(value)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  return cleaned.slice(0, 80);
}

function resolveUniqueSlug(list, requestedSlug, fallbackText, currentId = null) {
  const fallbackSlug = createSlugFromText(fallbackText) || `entry-${Date.now()}`;
  const base = isValidSlug(requestedSlug) ? requestedSlug : fallbackSlug;
  let candidate = base;
  let suffix = 2;

  while (
    list.some(
      (entry) =>
        entry.slug === candidate &&
        (currentId === null || Number(entry.id) !== Number(currentId))
    )
  ) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
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

function sanitizeSettingsUpdate(currentSettings, payload) {
  const next = cloneSettings(currentSettings);
  const source = payload && typeof payload === "object" ? payload : {};

  if (source.hero && typeof source.hero === "object") {
    next.hero.title = sanitizeLocalizedTextMap(source.hero.title, 180);
    next.hero.text = sanitizeLocalizedTextMap(source.hero.text, 500);
    next.hero.badge = sanitizeLocalizedTextMap(source.hero.badge, 120);
  }

  if (source.contact && typeof source.contact === "object") {
    next.contact.email = normalizeText(source.contact.email).slice(0, 180);
    next.contact.phone = normalizeText(source.contact.phone).slice(0, 80);
    next.contact.address = sanitizeLocalizedTextMap(source.contact.address, 260);
  }

  if (source.social && typeof source.social === "object") {
    next.social.facebook = sanitizeUrl(source.social.facebook);
    next.social.instagram = sanitizeUrl(source.social.instagram);
    next.social.linkedin = sanitizeUrl(source.social.linkedin);
    next.social.youtube = sanitizeUrl(source.social.youtube);
  }

  if (source.donation && typeof source.donation === "object") {
    next.donation.beneficiary = normalizeText(source.donation.beneficiary).slice(0, 140);
    next.donation.iban = normalizeText(source.donation.iban).slice(0, 90);
    next.donation.bic = normalizeText(source.donation.bic).slice(0, 60);
  }

  if (source.legal && typeof source.legal === "object") {
    next.legal.updatedAt = toIsoDate(source.legal.updatedAt);
    next.legal.registrationNumber = normalizeText(source.legal.registrationNumber).slice(0, 90);
    next.legal.taxReference = normalizeText(source.legal.taxReference).slice(0, 90);
  }

  return next;
}

function cloneSettings(settings) {
  return {
    hero: {
      title: sanitizeLocalizedTextMap(settings?.hero?.title, 180),
      text: sanitizeLocalizedTextMap(settings?.hero?.text, 500),
      badge: sanitizeLocalizedTextMap(settings?.hero?.badge, 120)
    },
    contact: {
      email: normalizeText(settings?.contact?.email).slice(0, 180),
      phone: normalizeText(settings?.contact?.phone).slice(0, 80),
      address: sanitizeLocalizedTextMap(settings?.contact?.address, 260)
    },
    social: {
      facebook: sanitizeUrl(settings?.social?.facebook),
      instagram: sanitizeUrl(settings?.social?.instagram),
      linkedin: sanitizeUrl(settings?.social?.linkedin),
      youtube: sanitizeUrl(settings?.social?.youtube)
    },
    donation: {
      beneficiary: normalizeText(settings?.donation?.beneficiary).slice(0, 140),
      iban: normalizeText(settings?.donation?.iban).slice(0, 90),
      bic: normalizeText(settings?.donation?.bic).slice(0, 60)
    },
    legal: {
      updatedAt: toIsoDate(settings?.legal?.updatedAt),
      registrationNumber: normalizeText(settings?.legal?.registrationNumber).slice(0, 90),
      taxReference: normalizeText(settings?.legal?.taxReference).slice(0, 90)
    }
  };
}

function normalizeProjectPayload(payload, list, currentProject = null) {
  const source = payload && typeof payload === "object" ? payload : {};
  const title = sanitizeLocalizedTextMap(source.title, 180);
  const category = sanitizeLocalizedTextMap(source.category, 120);
  const excerpt = sanitizeLocalizedTextMap(source.excerpt, 320);

  if (!hasLocalizedValue(title) || !hasLocalizedValue(category) || !hasLocalizedValue(excerpt)) {
    return { valid: false, message: "Project title, category, and excerpt are required." };
  }

  const slugInput = createSlugFromText(source.slug);
  const slug = resolveUniqueSlug(
    list,
    slugInput,
    title.en || title.ar || "project",
    currentProject?.id ?? null
  );

  return {
    valid: true,
    data: {
      id: currentProject?.id ?? null,
      slug,
      category,
      title,
      excerpt,
      status: sanitizeLocalizedTextMap(source.status, 120),
      budget: sanitizeLocalizedTextMap(source.budget, 80),
      beneficiaries: sanitizeLocalizedTextMap(source.beneficiaries, 100),
      implementationArea: sanitizeLocalizedTextMap(source.implementationArea, 220),
      timeline: sanitizeLocalizedTextMap(source.timeline, 160),
      objectives: sanitizeLocalizedListMap(source.objectives, 12, 200),
      outcomes: sanitizeLocalizedListMap(source.outcomes, 12, 200),
      partners: sanitizeLocalizedListMap(source.partners, 12, 140),
      updatedAt: toIsoDate(source.updatedAt)
    }
  };
}

function normalizeNewsPayload(payload, list, currentNews = null) {
  const source = payload && typeof payload === "object" ? payload : {};
  const title = sanitizeLocalizedTextMap(source.title, 180);
  const excerpt = sanitizeLocalizedTextMap(source.excerpt, 320);
  const content = sanitizeLocalizedListMap(source.content, 12, 700);

  if (!hasLocalizedValue(title) || !hasLocalizedValue(excerpt)) {
    return { valid: false, message: "News title and excerpt are required." };
  }

  if (!content.ar.length && !content.zgh.length && !content.en.length) {
    return { valid: false, message: "News content is required." };
  }

  const slugInput = createSlugFromText(source.slug);
  const slug = resolveUniqueSlug(list, slugInput, title.en || title.ar || "news", currentNews?.id ?? null);

  return {
    valid: true,
    data: {
      id: currentNews?.id ?? null,
      slug,
      title,
      excerpt,
      content,
      keyPoints: sanitizeLocalizedListMap(source.keyPoints, 8, 120),
      author: sanitizeLocalizedTextMap(source.author, 140),
      publishedAt: toIsoDate(source.publishedAt)
    }
  };
}

function normalizeMediaPayload(payload, list, currentMedia = null) {
  const source = payload && typeof payload === "object" ? payload : {};
  const title = sanitizeLocalizedTextMap(source.title, 180);

  if (!hasLocalizedValue(title)) {
    return { valid: false, message: "Media title is required." };
  }

  const type = normalizeText(source.type).toLowerCase();
  if (!adminMediaTypes.has(type)) {
    return { valid: false, message: "Media type is invalid." };
  }

  const url = sanitizeUrl(source.url);
  if (!url) {
    return { valid: false, message: "A valid media URL is required." };
  }

  const slugInput = createSlugFromText(source.slug);
  const slug = resolveUniqueSlug(list, slugInput, title.en || title.ar || "media", currentMedia?.id ?? null);

  return {
    valid: true,
    data: {
      id: currentMedia?.id ?? null,
      slug,
      type,
      title,
      description: sanitizeLocalizedTextMap(source.description, 280),
      url,
      thumbnail: sanitizeUrl(source.thumbnail) || url,
      createdAt: currentMedia?.createdAt || new Date().toISOString()
    }
  };
}

function getContentLength(req) {
  const value = req.headers["content-length"];
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
}

function containsBlockedObjectKeys(value, depth = 0) {
  if (!value || typeof value !== "object") {
    return false;
  }

  if (depth > 12) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.some((item) => containsBlockedObjectKeys(item, depth + 1));
  }

  const keys = Object.keys(value);
  for (const key of keys) {
    if (blockedObjectKeys.has(key)) {
      return true;
    }

    if (containsBlockedObjectKeys(value[key], depth + 1)) {
      return true;
    }
  }

  return false;
}

function validatePostRequestOrigin(req, res, next) {
  const lang = getRequestLang(req);
  const origin = normalizeOrigin(req.headers.origin);
  const refererOrigin = parseOriginFromReferer(req.headers.referer);

  if (origin && allowedOrigins.has(origin)) {
    next();
    return;
  }

  if (!origin && refererOrigin && allowedOrigins.has(refererOrigin)) {
    next();
    return;
  }

  if (!origin && !refererOrigin && ALLOW_NO_ORIGIN) {
    next();
    return;
  }

  res.status(403).json({
    message: textByLang(
      lang,
      "تم رفض الطلب بسبب سياسة المصدر.",
      "Yettwagi usuter ilmend n tasertit n uɣbalu.",
      "Request blocked by origin policy."
    )
  });
}

function requireJson(req, res, next) {
  const lang = getRequestLang(req);

  if (!req.is("application/json")) {
    res.status(415).json({
      message: textByLang(
        lang,
        "نوع البيانات غير مدعوم.",
        "Anaw n yisefka ur yettwasefrak ara.",
        "Unsupported content type."
      )
    });
    return;
  }

  next();
}

function requireAdminToken(req, res, next) {
  if (IS_PROD && EFFECTIVE_ADMIN_TOKEN.length < MIN_ADMIN_TOKEN_LENGTH) {
    res.status(503).json({
      message: "Admin endpoint is disabled due to missing secure token."
    });
    return;
  }

  const lang = getRequestLang(req);
  const rate = applyRateLimit(
    adminRateStore,
    `admin:${getClientKey(req)}`,
    ADMIN_RATE_LIMIT,
    RATE_WINDOW_MS
  );
  setRateHeaders(res, rate, ADMIN_RATE_LIMIT, "Admin-RateLimit");

  if (!rate.allowed) {
    res.status(429).json({
      message: textByLang(
        lang,
        "تم تجاوز الحد المسموح من محاولات الوصول إلى الإدارة.",
        "Ttawweḍḍaḍ azrag n unekcum n tedbelt.",
        "Admin access rate limit reached."
      )
    });
    return;
  }

  const provided = req.get("X-Admin-Token") || "";
  if (!safeCompare(provided, EFFECTIVE_ADMIN_TOKEN)) {
    res.status(401).json({
      message: "Unauthorized."
    });
    return;
  }

  next();
}

if (IS_PROD && ENABLE_ADMIN_ENDPOINT && EFFECTIVE_ADMIN_TOKEN.length < MIN_ADMIN_TOKEN_LENGTH) {
  console.error(
    `ADMIN_TOKEN must be set to at least ${MIN_ADMIN_TOKEN_LENGTH} characters in production.`
  );
  process.exit(1);
}

setInterval(() => {
  cleanupRateStore(apiRateStore);
  cleanupRateStore(contactRateStore);
  cleanupRateStore(newsletterRateStore);
  cleanupRateStore(adminRateStore);
}, RATE_WINDOW_MS).unref();

app.disable("x-powered-by");
app.set("trust proxy", TRUST_PROXY);
app.set("query parser", "simple");

app.use((req, res, next) => {
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

app.use(
  helmet({
    frameguard: {
      action: "deny"
    },
    hsts: IS_PROD
      ? {
          maxAge: 63072000,
          includeSubDomains: true,
          preload: true
        }
      : false,
    crossOriginResourcePolicy: {
      policy: "cross-origin"
    }
  })
);

const corsBaseOptions = {
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "X-Requested-With", "X-Admin-Token"],
  credentials: false,
  maxAge: 600
};

function corsOptionsDelegate(req, callback) {
  const origin = normalizeOrigin(req.headers.origin);
  const methodAllowsNoOrigin = isReadOnlyMethod(req.method);

  if (!origin) {
    callback(null, {
      ...corsBaseOptions,
      origin: ALLOW_NO_ORIGIN || methodAllowsNoOrigin
    });
    return;
  }

  if (!allowedOrigins.has(origin)) {
    callback(new Error("Origin is not allowed by CORS."), {
      ...corsBaseOptions,
      origin: false
    });
    return;
  }

  callback(null, {
    ...corsBaseOptions,
    origin: true
  });
}

app.use(cors(corsOptionsDelegate));
app.options("*", cors(corsOptionsDelegate));

app.use(morgan(IS_PROD ? "combined" : "dev"));

app.use("/api", (req, res, next) => {
  if ((req.originalUrl || "").length > MAX_URL_LENGTH) {
    res.status(414).json({
      message: "Request URI is too long."
    });
    return;
  }

  if (!allowedApiMethods.has(req.method)) {
    res.status(405).json({
      message: "Method not allowed."
    });
    return;
  }

  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    const contentLength = getContentLength(req);
    if (contentLength !== null && contentLength > MAX_JSON_BODY_BYTES) {
      res.status(413).json({
        message: "Request payload is too large."
      });
      return;
    }
  }
  res.setHeader("X-Robots-Tag", "noindex, nofollow, noarchive");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'"
  );

  const lang = getRequestLang(req);
  const rate = applyRateLimit(
    apiRateStore,
    `api:${getClientKey(req)}`,
    GENERIC_RATE_LIMIT,
    RATE_WINDOW_MS
  );
  setRateHeaders(res, rate, GENERIC_RATE_LIMIT, "RateLimit");

  if (!rate.allowed) {
    res.status(429).json({
      message: textByLang(
        lang,
        "تم تجاوز معدل الطلبات المسموح. حاول لاحقًا.",
        "Iɣli ufella n usuter. Eṛǧu kra n wakud.",
        "Too many requests. Please retry later."
      )
    });
    return;
  }

  next();
});

app.use(
  "/api",
  express.json({
    limit: `${MAX_JSON_BODY_BYTES}b`,
    strict: true,
    type: ["application/json", "application/*+json"]
  })
);

app.use("/api", (req, res, next) => {
  if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
    if (Array.isArray(req.body)) {
      res.status(400).json({
        message: "Invalid request payload."
      });
      return;
    }

    if (containsBlockedObjectKeys(req.body)) {
      res.status(400).json({
        message: "Blocked payload."
      });
      return;
    }
  }

  next();
});

app.get("/api/health", (req, res) => {
  if (IS_PROD) {
    res.json({
      status: "ok",
      time: new Date().toISOString()
    });
    return;
  }

  res.json({
    status: "ok",
    service: "ghassate-backend",
    environment: NODE_ENV,
    port: PORT,
    uptimeSeconds: Math.round(process.uptime()),
    time: new Date().toISOString()
  });
});

app.get("/api/projects", async (req, res) => {
  const store = await getCmsStore();
  const lang = normalizeLang(req.query.lang);
  const items = store.projects.map((project) => mapProjectByLang(project, lang));

  res.json({
    lang,
    total: items.length,
    items
  });
});

app.get("/api/projects/:slug", async (req, res) => {
  if (!isValidSlug(req.params.slug)) {
    res.status(400).json({
      message: "Invalid project slug."
    });
    return;
  }

  const store = await getCmsStore();
  const lang = normalizeLang(req.query.lang);
  const project = store.projects.find((item) => item.slug === req.params.slug);

  if (!project) {
    res.status(404).json({
      message: "Project not found."
    });
    return;
  }

  res.json(mapProjectByLang(project, lang));
});

app.get("/api/news", async (req, res) => {
  const store = await getCmsStore();
  const lang = normalizeLang(req.query.lang);
  const items = store.news.map((item) => mapNewsByLang(item, lang));

  res.json({
    lang,
    total: items.length,
    items
  });
});

app.get("/api/news/:slug", async (req, res) => {
  if (!isValidSlug(req.params.slug)) {
    res.status(400).json({
      message: "Invalid news slug."
    });
    return;
  }

  const store = await getCmsStore();
  const lang = normalizeLang(req.query.lang);
  const item = store.news.find((entry) => entry.slug === req.params.slug);

  if (!item) {
    res.status(404).json({
      message: "News item not found."
    });
    return;
  }

  res.json(mapNewsByLang(item, lang));
});

app.get("/api/impact", async (req, res) => {
  const store = await getCmsStore();
  const lang = normalizeLang(req.query.lang);
  res.json({
    lang,
    items: store.impact?.[lang] || store.impact?.ar || impact.ar
  });
});

app.get("/api/settings", async (req, res) => {
  const store = await getCmsStore();
  const lang = normalizeLang(req.query.lang);

  res.json({
    lang,
    settings: mapSettingsByLang(store.settings, lang),
    updatedAt: store.updatedAt
  });
});

app.post("/api/contact", validatePostRequestOrigin, requireJson, (req, res) => {
  const lang = getRequestLang(req);
  const rate = applyRateLimit(
    contactRateStore,
    `contact:${getClientKey(req)}`,
    CONTACT_RATE_LIMIT,
    RATE_WINDOW_MS
  );

  setRateHeaders(res, rate, CONTACT_RATE_LIMIT, "Contact-RateLimit");

  if (!rate.allowed) {
    res.status(429).json({
      message: textByLang(
        lang,
        "تم تجاوز الحد المسموح من المحاولات. حاول بعد دقيقة.",
        "Ttawweḍḍaḍ azrag n tikkal. Eṛǧu taseddaqiqt.",
        "Rate limit reached. Please retry in one minute."
      )
    });
    return;
  }

  const result = validateContactInput(req.body);

  if (!result.valid) {
    res.status(400).json({
      message: "Validation failed.",
      errors: result.errors
    });
    return;
  }

  const entry = {
    id: contactSubmissions.length + 1,
    ...result.data,
    createdAt: new Date().toISOString()
  };

  contactSubmissions.push(entry);
  trimStoredRecords(contactSubmissions);

  res.status(201).json({
    message: textByLang(
      result.data.lang,
      "تم استلام رسالتك بنجاح.",
      "Ttwassel-d izen inek s umata.",
      "Your message has been received successfully."
    ),
    id: entry.id
  });
});

app.post("/api/newsletter", validatePostRequestOrigin, requireJson, (req, res) => {
  const lang = getRequestLang(req);
  const rate = applyRateLimit(
    newsletterRateStore,
    `newsletter:${getClientKey(req)}`,
    NEWSLETTER_RATE_LIMIT,
    RATE_WINDOW_MS
  );

  setRateHeaders(res, rate, NEWSLETTER_RATE_LIMIT, "Newsletter-RateLimit");

  if (!rate.allowed) {
    res.status(429).json({
      message: textByLang(
        lang,
        "تم تجاوز الحد المسموح من المحاولات. حاول بعد دقيقة.",
        "Ttawweḍḍaḍ azrag n tikkal. Eṛǧu taseddaqiqt.",
        "Rate limit reached. Please retry in one minute."
      )
    });
    return;
  }

  const result = validateNewsletterInput(req.body);

  if (!result.valid) {
    res.status(400).json({
      message: "Validation failed.",
      errors: result.errors
    });
    return;
  }

  const exists = newsletterSubscribers.some((item) => item.email === result.data.email);
  if (exists) {
    res.json({
      message: textByLang(
        result.data.lang,
        "البريد الإلكتروني مشترك بالفعل.",
        "Imayl-a yemmuden yakan.",
        "This email is already subscribed."
      )
    });
    return;
  }

  const entry = {
    id: newsletterSubscribers.length + 1,
    ...result.data,
    createdAt: new Date().toISOString()
  };

  newsletterSubscribers.push(entry);
  trimStoredRecords(newsletterSubscribers);

  res.status(201).json({
    message: textByLang(
      result.data.lang,
      "تم الاشتراك في النشرة البريدية.",
      "Yella ummuden deg unebdu n imayl.",
      "Newsletter subscription completed."
    ),
    id: entry.id
  });
});

if (ADMIN_DASHBOARD_ENABLED) {
  app.get("/api/admin/summary", requireAdminToken, async (req, res) => {
    const store = await getCmsStore();
    res.json({
      totals: {
        contactSubmissions: contactSubmissions.length,
        newsletterSubscribers: newsletterSubscribers.length,
        projects: store.projects.length,
        news: store.news.length,
        media: store.media.length
      },
      updatedAt: store.updatedAt
    });
  });

  app.get("/api/admin/cms", requireAdminToken, async (req, res) => {
    const store = await getCmsStore();
    res.json(store);
  });

  app.put("/api/admin/settings", requireAdminToken, validatePostRequestOrigin, requireJson, async (req, res) => {
    const { store } = await updateCmsStore((draft) => {
      draft.settings = sanitizeSettingsUpdate(draft.settings, req.body);
    });

    res.json({
      message: "Settings updated successfully.",
      settings: store.settings,
      updatedAt: store.updatedAt
    });
  });

  app.post("/api/admin/projects", requireAdminToken, validatePostRequestOrigin, requireJson, async (req, res) => {
    const { store, result } = await updateCmsStore((draft) => {
      const normalized = normalizeProjectPayload(req.body, draft.projects);
      if (!normalized.valid) {
        return normalized;
      }

      const nextId = draft.nextIds.projects;
      draft.nextIds.projects += 1;
      draft.projects.unshift({
        ...normalized.data,
        id: nextId
      });

      return { valid: true, item: draft.projects[0] };
    });

    if (!result?.valid) {
      res.status(400).json({
        message: result?.message || "Invalid project payload."
      });
      return;
    }

    res.status(201).json({
      message: "Project created successfully.",
      item: result.item,
      total: store.projects.length
    });
  });

  app.put("/api/admin/projects/:id", requireAdminToken, validatePostRequestOrigin, requireJson, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ message: "Invalid project id." });
      return;
    }

    const { result } = await updateCmsStore((draft) => {
      const index = draft.projects.findIndex((item) => Number(item.id) === targetId);
      if (index === -1) {
        return { valid: false, status: 404, message: "Project not found." };
      }

      const normalized = normalizeProjectPayload(req.body, draft.projects, draft.projects[index]);
      if (!normalized.valid) {
        return normalized;
      }

      draft.projects[index] = {
        ...draft.projects[index],
        ...normalized.data,
        id: draft.projects[index].id
      };

      return { valid: true, item: draft.projects[index] };
    });

    if (!result?.valid) {
      res.status(result?.status || 400).json({
        message: result?.message || "Invalid project payload."
      });
      return;
    }

    res.json({
      message: "Project updated successfully.",
      item: result.item
    });
  });

  app.delete("/api/admin/projects/:id", requireAdminToken, validatePostRequestOrigin, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ message: "Invalid project id." });
      return;
    }

    const { result } = await updateCmsStore((draft) => {
      const before = draft.projects.length;
      draft.projects = draft.projects.filter((item) => Number(item.id) !== targetId);

      if (draft.projects.length === before) {
        return { valid: false, status: 404, message: "Project not found." };
      }

      return { valid: true };
    });

    if (!result?.valid) {
      res.status(result?.status || 400).json({
        message: result?.message || "Project could not be deleted."
      });
      return;
    }

    res.json({ message: "Project deleted successfully." });
  });

  app.post("/api/admin/news", requireAdminToken, validatePostRequestOrigin, requireJson, async (req, res) => {
    const { store, result } = await updateCmsStore((draft) => {
      const normalized = normalizeNewsPayload(req.body, draft.news);
      if (!normalized.valid) {
        return normalized;
      }

      const nextId = draft.nextIds.news;
      draft.nextIds.news += 1;
      draft.news.unshift({
        ...normalized.data,
        id: nextId
      });

      return { valid: true, item: draft.news[0] };
    });

    if (!result?.valid) {
      res.status(400).json({
        message: result?.message || "Invalid news payload."
      });
      return;
    }

    res.status(201).json({
      message: "News item created successfully.",
      item: result.item,
      total: store.news.length
    });
  });

  app.put("/api/admin/news/:id", requireAdminToken, validatePostRequestOrigin, requireJson, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ message: "Invalid news id." });
      return;
    }

    const { result } = await updateCmsStore((draft) => {
      const index = draft.news.findIndex((item) => Number(item.id) === targetId);
      if (index === -1) {
        return { valid: false, status: 404, message: "News item not found." };
      }

      const normalized = normalizeNewsPayload(req.body, draft.news, draft.news[index]);
      if (!normalized.valid) {
        return normalized;
      }

      draft.news[index] = {
        ...draft.news[index],
        ...normalized.data,
        id: draft.news[index].id
      };

      return { valid: true, item: draft.news[index] };
    });

    if (!result?.valid) {
      res.status(result?.status || 400).json({
        message: result?.message || "Invalid news payload."
      });
      return;
    }

    res.json({
      message: "News item updated successfully.",
      item: result.item
    });
  });

  app.delete("/api/admin/news/:id", requireAdminToken, validatePostRequestOrigin, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ message: "Invalid news id." });
      return;
    }

    const { result } = await updateCmsStore((draft) => {
      const before = draft.news.length;
      draft.news = draft.news.filter((item) => Number(item.id) !== targetId);

      if (draft.news.length === before) {
        return { valid: false, status: 404, message: "News item not found." };
      }

      return { valid: true };
    });

    if (!result?.valid) {
      res.status(result?.status || 400).json({
        message: result?.message || "News item could not be deleted."
      });
      return;
    }

    res.json({ message: "News item deleted successfully." });
  });

  app.post("/api/admin/media", requireAdminToken, validatePostRequestOrigin, requireJson, async (req, res) => {
    const { store, result } = await updateCmsStore((draft) => {
      const normalized = normalizeMediaPayload(req.body, draft.media);
      if (!normalized.valid) {
        return normalized;
      }

      const nextId = draft.nextIds.media;
      draft.nextIds.media += 1;
      draft.media.unshift({
        ...normalized.data,
        id: nextId
      });

      return { valid: true, item: draft.media[0] };
    });

    if (!result?.valid) {
      res.status(400).json({
        message: result?.message || "Invalid media payload."
      });
      return;
    }

    res.status(201).json({
      message: "Media item created successfully.",
      item: result.item,
      total: store.media.length
    });
  });

  app.put("/api/admin/media/:id", requireAdminToken, validatePostRequestOrigin, requireJson, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ message: "Invalid media id." });
      return;
    }

    const { result } = await updateCmsStore((draft) => {
      const index = draft.media.findIndex((item) => Number(item.id) === targetId);
      if (index === -1) {
        return { valid: false, status: 404, message: "Media item not found." };
      }

      const normalized = normalizeMediaPayload(req.body, draft.media, draft.media[index]);
      if (!normalized.valid) {
        return normalized;
      }

      draft.media[index] = {
        ...draft.media[index],
        ...normalized.data,
        id: draft.media[index].id
      };

      return { valid: true, item: draft.media[index] };
    });

    if (!result?.valid) {
      res.status(result?.status || 400).json({
        message: result?.message || "Invalid media payload."
      });
      return;
    }

    res.json({
      message: "Media item updated successfully.",
      item: result.item
    });
  });

  app.delete("/api/admin/media/:id", requireAdminToken, validatePostRequestOrigin, async (req, res) => {
    const targetId = Number(req.params.id);
    if (!Number.isFinite(targetId)) {
      res.status(400).json({ message: "Invalid media id." });
      return;
    }

    const { result } = await updateCmsStore((draft) => {
      const before = draft.media.length;
      draft.media = draft.media.filter((item) => Number(item.id) !== targetId);

      if (draft.media.length === before) {
        return { valid: false, status: 404, message: "Media item not found." };
      }

      return { valid: true };
    });

    if (!result?.valid) {
      res.status(result?.status || 400).json({
        message: result?.message || "Media item could not be deleted."
      });
      return;
    }

    res.json({ message: "Media item deleted successfully." });
  });
}

app.get("/sitemap.xml", async (req, res) => {
  const store = await getCmsStore();
  const xml = buildSitemapXml({ origin: PUBLIC_ORIGIN, projects: store.projects, news: store.news });
  res.setHeader("Cache-Control", "public, max-age=3600, stale-while-revalidate=86400");
  res.type("application/xml").send(xml);
});

app.get("/robots.txt", (req, res) => {
  const robots = buildRobotsTxt({ origin: PUBLIC_ORIGIN });
  res.setHeader("Cache-Control", "public, max-age=43200");
  res.type("text/plain").send(robots);
});

app.use((req, res) => {
  res.status(404).json({
    message: "Route not found."
  });
});

app.use((error, req, res, next) => {
  const lang = normalizeLang(req.query?.lang || req.body?.lang);

  if (error?.type === "entity.too.large") {
    res.status(413).json({
      message: textByLang(
        lang,
        "حجم الطلب أكبر من الحد المسموح.",
        "Tiddi n usuter tugar talast i yettwasiregen.",
        "Request payload is too large."
      )
    });
    return;
  }

  if (error instanceof SyntaxError && error.status === 400 && "body" in error) {
    res.status(400).json({
      message: textByLang(
        lang,
        "بنية JSON غير صالحة.",
        "Tamṣukt n JSON ur tmeɣri ara.",
        "Malformed JSON body."
      )
    });
    return;
  }

  if (error?.message?.includes("CORS") || error?.message?.includes("Origin")) {
    res.status(403).json({
      message: textByLang(
        lang,
        "تم رفض الطلب بسبب سياسة المصدر.",
        "Yettwagi usuter ilmend n tasertit n uɣbalu.",
        "Request blocked by CORS policy."
      )
    });
    return;
  }

  if (!IS_PROD) {
    console.error(error);
  }

  res.status(500).json({
    message: "Unexpected server error."
  });
});

const server = app.listen(PORT, () => {
  console.log(`Ghassate backend is running on http://localhost:${PORT}`);
});

server.keepAliveTimeout = 5000;
server.headersTimeout = 15000;
server.requestTimeout = 20000;
server.maxRequestsPerSocket = 100;

function gracefulShutdown(signal) {
  console.log(`${signal} received. Shutting down server...`);
  server.close(() => {
    process.exit(0);
  });

  setTimeout(() => {
    process.exit(1);
  }, 10000).unref();
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
