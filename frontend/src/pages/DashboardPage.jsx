import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import {
  adminLogin,
  createAdminMedia,
  createAdminNews,
  createAdminPage,
  createAdminProject,
  deleteAdminMedia,
  deleteAdminNews,
  deleteAdminPage,
  deleteAdminProject,
  getAdminCms,
  getAdminSummary,
  updateAdminMedia,
  updateAdminNews,
  updateAdminPage,
  updateAdminProject,
  updateAdminSettings
} from "../lib/api";
import { DASHBOARD_SECRET_PATH } from "../lib/runtime-config";

const TOKEN_STORAGE_KEY = "ghassate_admin_jwt";
const TAB_STORAGE_KEY = "ghassate_dashboard_tab";
const tabs = ["overview", "settings", "projects", "news", "pages", "media"];
const localizedTemplate = { ar: "", zgh: "", en: "" };

/* ── Inline SVG Icons ── */
const I = (d, vb = "0 0 24 24") => (
  <svg viewBox={vb} className="tab-icon">
    <path d={d} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const tabIconMap = {
  overview: I("M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1m-2 0h2"),
  settings: I("M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z"),
  projects: I("M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"),
  news: I("M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"),
  pages: I("M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"),
  media: I("M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"),
};

const kpiIcons = [
  "M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10",
  "M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z",
  "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z",
  "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z",
  "M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z",
  "M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9",
];

function toTextMap(value) {
  return {
    ar: Array.isArray(value?.ar) ? value.ar.join("\n") : value?.ar || "",
    zgh: Array.isArray(value?.zgh) ? value.zgh.join("\n") : value?.zgh || "",
    en: Array.isArray(value?.en) ? value.en.join("\n") : value?.en || ""
  };
}

function toLocalizedSearchText(value) {
  if (Array.isArray(value)) {
    return value.join(" ");
  }

  if (value && typeof value === "object") {
    return ["ar", "zgh", "en"]
      .map((code) => {
        const entry = value[code];
        return Array.isArray(entry) ? entry.join(" ") : String(entry || "");
      })
      .join(" ");
  }

  return String(value || "");
}

function hasQueryMatch(query, ...values) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) {
    return true;
  }

  return values
    .map((value) => toLocalizedSearchText(value))
    .join(" ")
    .toLowerCase()
    .includes(normalized);
}

function formatShortDate(value, lang) {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return lang === "en" ? "N/A" : "غير متاح";
  }

  return parsed.toLocaleDateString(lang === "en" ? "en-US" : "ar-MA", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

function LocalizedEditor({ label, value, onChange, multiline = false }) {
  const Tag = multiline ? "textarea" : "input";
  const langs = [
    { code: "ar", label: "العربية" },
    { code: "zgh", label: "الأمازيغية" },
    { code: "en", label: "English" }
  ];

  return (
    <div className="dashboard-field-group">
      <h4>{label}</h4>
      <div className="dashboard-field-grid">
        {langs.map((entry) => (
          <label key={`${label}-${entry.code}`}>
            <span>{entry.label}</span>
            <Tag
              value={value?.[entry.code] || ""}
              rows={multiline ? 4 : undefined}
              onChange={(event) => onChange(entry.code, event.target.value)}
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function previewLocalized(map, lang) {
  return map?.[lang] || map?.ar || map?.zgh || map?.en || "";
}

function emptyProject() {
  return {
    slug: "",
    category: { ...localizedTemplate },
    title: { ...localizedTemplate },
    excerpt: { ...localizedTemplate },
    status: { ...localizedTemplate },
    budget: { ...localizedTemplate },
    beneficiaries: { ...localizedTemplate },
    implementationArea: { ...localizedTemplate },
    timeline: { ...localizedTemplate },
    objectives: { ...localizedTemplate },
    outcomes: { ...localizedTemplate },
    partners: { ...localizedTemplate },
    updatedAt: new Date().toISOString().slice(0, 10)
  };
}

function emptyNews() {
  return {
    slug: "",
    title: { ...localizedTemplate },
    excerpt: { ...localizedTemplate },
    content: { ...localizedTemplate },
    keyPoints: { ...localizedTemplate },
    author: { ...localizedTemplate },
    publishedAt: new Date().toISOString().slice(0, 10)
  };
}

function emptyMedia() {
  return {
    slug: "",
    type: "image",
    title: { ...localizedTemplate },
    description: { ...localizedTemplate },
    url: "",
    thumbnail: ""
  };
}

function emptyPage() {
  return {
    slug: "",
    title: { ...localizedTemplate },
    excerpt: { ...localizedTemplate },
    content: { ...localizedTemplate },
    status: "published",
    publishedAt: new Date().toISOString().slice(0, 10),
    updatedAt: new Date().toISOString().slice(0, 10)
  };
}

export default function DashboardPage() {
  const { lang, content } = useOutletContext();
  const isArabic = lang !== "en";

  const [token, setToken] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [cms, setCms] = useState(null);
  const [summary, setSummary] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState("");

  const [settingsForm, setSettingsForm] = useState(null);
  const [projectForm, setProjectForm] = useState(emptyProject());
  const [newsForm, setNewsForm] = useState(emptyNews());
  const [pageForm, setPageForm] = useState(emptyPage());
  const [mediaForm, setMediaForm] = useState(emptyMedia());
  const [editingProjectId, setEditingProjectId] = useState(null);
  const [editingNewsId, setEditingNewsId] = useState(null);
  const [editingPageId, setEditingPageId] = useState(null);
  const [editingMediaId, setEditingMediaId] = useState(null);
  const [projectQuery, setProjectQuery] = useState("");
  const [newsQuery, setNewsQuery] = useState("");
  const [pageQuery, setPageQuery] = useState("");
  const [pageStatusFilter, setPageStatusFilter] = useState("all");
  const [mediaQuery, setMediaQuery] = useState("");
  const [mediaTypeFilter, setMediaTypeFilter] = useState("all");
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((msg, type = "success") => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3500);
  }, []);

  const tabLabels = useMemo(
    () => ({
      overview: isArabic ? "نظرة عامة" : "Overview",
      settings: isArabic ? "إعدادات الموقع" : "Settings",
      projects: isArabic ? "المشاريع" : "Projects",
      news: isArabic ? "المقالات والمنشورات" : "Posts",
      pages: isArabic ? "الصفحات" : "Pages",
      media: isArabic ? "الوسائط" : "Media"
    }),
    [isArabic]
  );

  const tabTotals = useMemo(
    () => ({
      projects: cms?.projects?.length || 0,
      news: cms?.news?.length || 0,
      pages: cms?.pages?.length || 0,
      media: cms?.media?.length || 0
    }),
    [cms]
  );

  const filteredProjects = useMemo(() => {
    const items = Array.isArray(cms?.projects) ? cms.projects : [];
    return items.filter((item) =>
      hasQueryMatch(projectQuery, item.slug, item.title, item.category, item.excerpt, item.status)
    );
  }, [cms?.projects, projectQuery]);

  const filteredNews = useMemo(() => {
    const items = Array.isArray(cms?.news) ? cms.news : [];
    return items.filter((item) =>
      hasQueryMatch(newsQuery, item.slug, item.title, item.excerpt, item.author, item.content, item.keyPoints)
    );
  }, [cms?.news, newsQuery]);

  const filteredPages = useMemo(() => {
    const items = Array.isArray(cms?.pages) ? cms.pages : [];
    return items.filter((item) => {
      const itemStatus = String(item?.status || "published").toLowerCase();
      const matchesStatus = pageStatusFilter === "all" || itemStatus === pageStatusFilter;
      return matchesStatus && hasQueryMatch(pageQuery, item.slug, item.title, item.excerpt, item.content, item.status);
    });
  }, [cms?.pages, pageQuery, pageStatusFilter]);

  const filteredMedia = useMemo(() => {
    const items = Array.isArray(cms?.media) ? cms.media : [];
    return items.filter((item) => {
      const matchesType = mediaTypeFilter === "all" || item.type === mediaTypeFilter;
      return matchesType && hasQueryMatch(mediaQuery, item.slug, item.type, item.title, item.description, item.url);
    });
  }, [cms?.media, mediaQuery, mediaTypeFilter]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const savedToken = window.localStorage.getItem(TOKEN_STORAGE_KEY) || "";
    const savedTab = window.localStorage.getItem(TAB_STORAGE_KEY) || "";

    if (savedToken) {
      setToken(savedToken);
    }

    if (tabs.includes(savedTab)) {
      setActiveTab(savedTab);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    window.localStorage.setItem(TAB_STORAGE_KEY, activeTab);
  }, [activeTab]);

  useEffect(() => {
    if (!token) {
      return;
    }
    loadCms(token);
  }, [token]);

  async function loadCms(activeToken) {
    setLoading(true);
    setError("");
    try {
      const [cmsData, summaryData] = await Promise.all([
        getAdminCms(activeToken),
        getAdminSummary(activeToken).catch(() => null)
      ]);

      setCms(cmsData);
      setSummary(summaryData);
      setSettingsForm(cmsData.settings);
    } catch (requestError) {
      const msg = requestError?.message || "";
      const isUnauthorized = msg.toLowerCase().includes("unauthorized") || msg.includes("401");
      if (isUnauthorized) {
        // JWT expired or invalid — force re-login
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(TOKEN_STORAGE_KEY);
        }
        setToken("");
        setError(isArabic ? "انتهت صلاحية الجلسة. سجّل الدخول مجدداً." : "Session expired. Please log in again.");
      } else {
        setError(msg || (isArabic ? "تعذر الوصول إلى لوحة التحكم." : "Dashboard access failed."));
      }
      setCms(null);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }

  function resetProjectForm() {
    setEditingProjectId(null);
    setProjectForm(emptyProject());
  }

  function resetNewsForm() {
    setEditingNewsId(null);
    setNewsForm(emptyNews());
  }

  function resetPageForm() {
    setEditingPageId(null);
    setPageForm(emptyPage());
  }

  function resetMediaForm() {
    setEditingMediaId(null);
    setMediaForm(emptyMedia());
  }

  async function onLogin(event) {
    event.preventDefault();
    const email = emailInput.trim();
    const password = passwordInput;
    if (!email || !password) {
      setError(isArabic ? "أدخل البريد الإلكتروني وكلمة السر." : "Enter email and password.");
      return;
    }

    setLoginLoading(true);
    setError("");

    try {
      const response = await adminLogin(email, password);
      const jwt = response.token;

      if (!jwt) {
        setError(isArabic ? "لم يتم استلام رمز الجلسة." : "No session token received.");
        return;
      }

      if (typeof window !== "undefined") {
        window.localStorage.setItem(TOKEN_STORAGE_KEY, jwt);
      }

      setToken(jwt);
      setNotice("");
    } catch (requestError) {
      setError(requestError?.message || (isArabic ? "فشل تسجيل الدخول." : "Login failed."));
    } finally {
      setLoginLoading(false);
    }
  }

  function logout() {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(TOKEN_STORAGE_KEY);
    }
    setToken("");
    setEmailInput("");
    setPasswordInput("");
    setCms(null);
    setSummary(null);
    setSettingsForm(null);
    resetProjectForm();
    resetNewsForm();
    resetPageForm();
    resetMediaForm();
    setProjectQuery("");
    setNewsQuery("");
    setPageQuery("");
    setPageStatusFilter("all");
    setMediaQuery("");
    setMediaTypeFilter("all");
    setError("");
    setNotice("");
  }

  async function saveSettings(event) {
    event.preventDefault();
    if (!settingsForm) {
      return;
    }
    setBusy("settings");
    setError("");
    setNotice("");
    try {
      await updateAdminSettings(token, settingsForm);
      await loadCms(token);
      pushToast(isArabic ? "تم حفظ الإعدادات." : "Settings saved.");
    } catch (requestError) {
      setError(requestError.message || "Settings save failed.");
    } finally {
      setBusy("");
    }
  }

  async function saveProject(event) {
    event.preventDefault();
    setBusy("projects");
    setError("");
    setNotice("");
    try {
      const payload = {
        ...projectForm,
        updatedAt: projectForm.updatedAt || new Date().toISOString().slice(0, 10)
      };
      if (editingProjectId) {
        await updateAdminProject(token, editingProjectId, payload);
      } else {
        await createAdminProject(token, payload);
      }
      await loadCms(token);
      resetProjectForm();
      pushToast(isArabic ? "تم حفظ المشروع." : "Project saved.");
    } catch (requestError) {
      setError(requestError.message || "Project save failed.");
    } finally {
      setBusy("");
    }
  }

  async function removeProject(id) {
    if (typeof window !== "undefined" && !window.confirm(isArabic ? "حذف المشروع؟" : "Delete project?")) {
      return;
    }
    setBusy(`project-${id}`);
    setError("");
    setNotice("");
    try {
      await deleteAdminProject(token, id);
      await loadCms(token);
      pushToast(isArabic ? "تم حذف المشروع." : "Project deleted.");
      if (editingProjectId === id) {
        resetProjectForm();
      }
    } catch (requestError) {
      setError(requestError.message || "Project deletion failed.");
    } finally {
      setBusy("");
    }
  }

  async function saveNews(event) {
    event.preventDefault();
    setBusy("news");
    setError("");
    setNotice("");
    try {
      const payload = {
        ...newsForm,
        publishedAt: newsForm.publishedAt || new Date().toISOString().slice(0, 10)
      };
      if (editingNewsId) {
        await updateAdminNews(token, editingNewsId, payload);
      } else {
        await createAdminNews(token, payload);
      }
      await loadCms(token);
      resetNewsForm();
      pushToast(isArabic ? "تم حفظ الخبر." : "News saved.");
    } catch (requestError) {
      setError(requestError.message || "News save failed.");
    } finally {
      setBusy("");
    }
  }

  async function removeNews(id) {
    if (typeof window !== "undefined" && !window.confirm(isArabic ? "حذف الخبر؟" : "Delete news item?")) {
      return;
    }
    setBusy(`news-${id}`);
    setError("");
    setNotice("");
    try {
      await deleteAdminNews(token, id);
      await loadCms(token);
      pushToast(isArabic ? "تم حذف الخبر." : "News deleted.");
      if (editingNewsId === id) {
        resetNewsForm();
      }
    } catch (requestError) {
      setError(requestError.message || "News deletion failed.");
    } finally {
      setBusy("");
    }
  }

  async function savePage(event) {
    event.preventDefault();
    setBusy("pages");
    setError("");
    setNotice("");
    try {
      const payload = {
        ...pageForm,
        status: String(pageForm.status || "published").toLowerCase(),
        publishedAt: pageForm.publishedAt || new Date().toISOString().slice(0, 10),
        updatedAt: new Date().toISOString().slice(0, 10)
      };
      if (editingPageId) {
        await updateAdminPage(token, editingPageId, payload);
      } else {
        await createAdminPage(token, payload);
      }
      await loadCms(token);
      resetPageForm();
      pushToast(isArabic ? "تم حفظ الصفحة." : "Page saved.");
    } catch (requestError) {
      setError(requestError.message || "Page save failed.");
    } finally {
      setBusy("");
    }
  }

  async function removePage(id) {
    if (typeof window !== "undefined" && !window.confirm(isArabic ? "حذف الصفحة؟" : "Delete page?")) {
      return;
    }
    setBusy(`page-${id}`);
    setError("");
    setNotice("");
    try {
      await deleteAdminPage(token, id);
      await loadCms(token);
      pushToast(isArabic ? "تم حذف الصفحة." : "Page deleted.");
      if (editingPageId === id) {
        resetPageForm();
      }
    } catch (requestError) {
      setError(requestError.message || "Page deletion failed.");
    } finally {
      setBusy("");
    }
  }

  async function saveMedia(event) {
    event.preventDefault();
    setBusy("media");
    setError("");
    setNotice("");
    try {
      if (editingMediaId) {
        await updateAdminMedia(token, editingMediaId, mediaForm);
      } else {
        await createAdminMedia(token, mediaForm);
      }
      await loadCms(token);
      resetMediaForm();
      pushToast(isArabic ? "تم حفظ عنصر الوسائط." : "Media saved.");
    } catch (requestError) {
      setError(requestError.message || "Media save failed.");
    } finally {
      setBusy("");
    }
  }

  async function removeMedia(id) {
    if (typeof window !== "undefined" && !window.confirm(isArabic ? "حذف الوسائط؟" : "Delete media item?")) {
      return;
    }
    setBusy(`media-${id}`);
    setError("");
    setNotice("");
    try {
      await deleteAdminMedia(token, id);
      await loadCms(token);
      pushToast(isArabic ? "تم حذف الوسائط." : "Media deleted.");
      if (editingMediaId === id) {
        resetMediaForm();
      }
    } catch (requestError) {
      setError(requestError.message || "Media deletion failed.");
    } finally {
      setBusy("");
    }
  }

  const updatedAtLabel = formatShortDate(summary?.updatedAt || cms?.updatedAt, lang);

  return (
    <>
      <Seo
        lang={lang}
        title={isArabic ? "بوابة الإدارة الخاصة | مؤسسة غسات الكبرى" : "Private Admin Portal | Ghassate Organization"}
        description={
          isArabic
            ? "بوابة إدارة خاصة لإعدادات الموقع والمحتوى."
            : "A private admin portal for managing website settings and content."
        }
        slug={DASHBOARD_SECRET_PATH}
        noindex
        schemaType="WebPage"
        breadcrumbs={[{ name: isArabic ? "بوابة الإدارة" : "Admin Portal", slug: DASHBOARD_SECRET_PATH }]}
      />

      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: isArabic ? "بوابة الإدارة" : "Admin Portal" }]} />
          <div className="section-top">
            <span className="section-tag">{isArabic ? "منطقة خاصة" : "Private Zone"}</span>
            <h1 className="section-title">{isArabic ? "بوابة الإدارة الخاصة" : "Private Admin Portal"}</h1>
            <p className="section-copy">
              {isArabic
                ? "إدارة المحتوى بشكل مركزي: إعدادات، مشاريع، منشورات، صفحات، ووسائط."
                : "Manage content centrally: settings, projects, posts, pages, and media."}
            </p>
          </div>
        </div>

        {!token ? (
          <div className="container admin-login-wrap">
            <form className="surface-card admin-login-card" onSubmit={onLogin}>
              <div className="admin-login-icon">
                <svg viewBox="0 0 24 24"><path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <h3>{isArabic ? "تسجيل الدخول" : "Sign In"}</h3>
              <p>
                {isArabic
                  ? "الدخول متاح فقط للمسؤولين المصرح لهم."
                  : "Access is restricted to authorized administrators only."}
              </p>
              <label htmlFor="admin-email">{isArabic ? "البريد الإلكتروني" : "Email"}</label>
              <input
                id="admin-email"
                type="email"
                autoComplete="email"
                value={emailInput}
                onChange={(event) => setEmailInput(event.target.value)}
                required
              />
              <label htmlFor="admin-password">{isArabic ? "كلمة السر" : "Password"}</label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={passwordInput}
                onChange={(event) => setPasswordInput(event.target.value)}
                required
              />
              <button className="btn btn-primary" type="submit" disabled={loginLoading}>
                {loginLoading
                  ? (isArabic ? "جارٍ التحقق..." : "Verifying...")
                  : (isArabic ? "دخول اللوحة" : "Access Dashboard")}
              </button>
              {error ? <p className="form-message error">{error}</p> : null}
            </form>
          </div>
        ) : (
          <div className="container admin-shell">
            <div className="admin-toolbar">
              <div className="admin-toolbar-main">
                <h3>{isArabic ? "لوحة التحكم" : "Dashboard"}</h3>
                <p className="admin-toolbar-meta">
                  <span className="admin-status-dot"></span>
                  {isArabic ? "آخر تحديث:" : "Last update:"} <strong>{updatedAtLabel}</strong>
                </p>
              </div>
              <div className="admin-inline-actions">
                <button className="btn btn-outline-ink" type="button" onClick={() => loadCms(token)}>
                  {isArabic ? "تحديث" : "Refresh"}
                </button>
                <button className="btn btn-primary" type="button" onClick={logout}>
                  {isArabic ? "خروج" : "Logout"}
                </button>
              </div>
            </div>

            <div className="admin-layout">
              <aside className="admin-sidebar">
                <h3>{isArabic ? "القائمة" : "NAVIGATION"}</h3>
                <div className="admin-side-nav">
                  {tabs.map((tab) => {
                    const showCount = tab === "projects" || tab === "news" || tab === "pages" || tab === "media";
                    return (
                      <button
                        key={tab}
                        type="button"
                        className={`admin-side-link ${activeTab === tab ? "is-active" : ""}`}
                        onClick={() => setActiveTab(tab)}
                      >
                        <span className="tab-label">{tabIconMap[tab]}<span>{tabLabels[tab]}</span></span>
                        {showCount ? <span className="admin-tab-count">{tabTotals[tab]}</span> : null}
                      </button>
                    );
                  })}
                </div>
              </aside>

              <div className="admin-main">
                {notice ? <p className="form-message success">{notice}</p> : null}
                {error ? <p className="form-message error">{error}</p> : null}
                {loading ? <p className="form-message loading">{content.common.loading}</p> : null}

                {!loading && cms ? (
                  <>
                {activeTab === "overview" ? (
                  <>
                    <div className="admin-welcome">
                      <div className="admin-welcome-text">
                        <h2>{isArabic ? "مرحباً بك في لوحة التحكم" : "Welcome to your Dashboard"}</h2>
                        <p>{isArabic
                          ? "إدارة مركزية لجميع محتويات مؤسسة غسات الكبرى — المشاريع، الأخبار، الصفحات والوسائط."
                          : "Central management for all Ghassate Organization content — projects, news, pages and media."}</p>
                      </div>
                      <div className="admin-welcome-stat">
                        <div className="admin-welcome-stat-item">
                          <strong>{(summary?.totals?.projects ?? cms.projects.length) + (summary?.totals?.news ?? cms.news.length)}</strong>
                          <span>{isArabic ? "محتوى" : "Content"}</span>
                        </div>
                        <div className="admin-welcome-stat-item">
                          <strong>{(summary?.totals?.contactSubmissions ?? 0) + (summary?.totals?.newsletterSubscribers ?? 0)}</strong>
                          <span>{isArabic ? "تفاعل" : "Interactions"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="cards-grid grid-3 admin-overview-grid">
                      {[
                        { label: isArabic ? "المشاريع" : "Projects", value: summary?.totals?.projects ?? cms.projects.length },
                        { label: isArabic ? "الأخبار" : "News", value: summary?.totals?.news ?? cms.news.length },
                        { label: isArabic ? "الصفحات" : "Pages", value: summary?.totals?.pages ?? cms.pages?.length ?? 0 },
                        { label: isArabic ? "الوسائط" : "Media", value: summary?.totals?.media ?? cms.media.length },
                        { label: isArabic ? "رسائل التواصل" : "Messages", value: summary?.totals?.contactSubmissions ?? 0 },
                        { label: isArabic ? "مشتركو النشرة" : "Subscribers", value: summary?.totals?.newsletterSubscribers ?? 0 },
                      ].map((kpi, i) => (
                        <article className="surface-card admin-kpi-card" key={kpi.label}>
                          <span className="kpi-icon"><svg viewBox="0 0 24 24"><path d={kpiIcons[i]} /></svg></span>
                          <h3>{kpi.label}</h3>
                          <p className="admin-kpi-value">{kpi.value}</p>
                        </article>
                      ))}
                    </div>

                    <div className="admin-quick-actions">
                      {[
                        { label: isArabic ? "مشروع جديد" : "New Project", tab: "projects", icon: "M12 4v16m8-8H4" },
                        { label: isArabic ? "خبر جديد" : "New Post", tab: "news", icon: "M12 4v16m8-8H4" },
                        { label: isArabic ? "صفحة جديدة" : "New Page", tab: "pages", icon: "M12 4v16m8-8H4" },
                        { label: isArabic ? "إعدادات الموقع" : "Site Settings", tab: "settings", icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z" },
                      ].map((qa) => (
                        <button key={qa.tab} type="button" className="admin-quick-btn" onClick={() => setActiveTab(qa.tab)}>
                          <svg viewBox="0 0 24 24"><path d={qa.icon} /></svg>
                          {qa.label}
                        </button>
                      ))}
                    </div>

                    <article className="surface-card admin-help-note">
                      <h3>{isArabic ? "كيف تنعكس التعديلات على الاستضافة؟" : "How do updates reach hosting?"}</h3>
                      <ol className="admin-steps">
                        <li>
                          {isArabic
                            ? "احفظ التعديلات من هذه البوابة (تُكتب في ملف CMS داخل API)."
                            : "Save updates in this portal (written to the CMS storage file in the API)."}
                        </li>
                        <li>
                          {isArabic
                            ? "إذا عدلت كود الواجهة: نفّذ build ثم ارفع محتوى frontend/dist إلى public_html."
                            : "If you changed frontend code: run build, then upload frontend/dist to public_html."}
                        </li>
                        <li>
                          {isArabic
                            ? "إذا عدلت كود الـAPI: ارفع backend-php/api إلى public_html/api."
                            : "If you changed API code: upload backend-php/api to public_html/api."}
                        </li>
                      </ol>
                    </article>
                  </>
                ) : null}

                {activeTab === "settings" && settingsForm ? (
                  <form className="surface-card admin-form" onSubmit={saveSettings}>
                    <h3>{isArabic ? "إعدادات الموقع" : "Site Settings"}</h3>
                    <LocalizedEditor
                      label={isArabic ? "عنوان الواجهة" : "Hero Title"}
                      value={settingsForm.hero?.title || localizedTemplate}
                      onChange={(code, value) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, title: { ...(prev.hero?.title || localizedTemplate), [code]: value } }
                        }))
                      }
                    />
                    <LocalizedEditor
                      label={isArabic ? "نص الواجهة" : "Hero Text"}
                      value={settingsForm.hero?.text || localizedTemplate}
                      multiline
                      onChange={(code, value) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, text: { ...(prev.hero?.text || localizedTemplate), [code]: value } }
                        }))
                      }
                    />
                    <LocalizedEditor
                      label={isArabic ? "شارة الواجهة" : "Hero Badge"}
                      value={settingsForm.hero?.badge || localizedTemplate}
                      onChange={(code, value) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, badge: { ...(prev.hero?.badge || localizedTemplate), [code]: value } }
                        }))
                      }
                    />
                    <div className="dashboard-field-grid">
                      <label>
                        <span>Email</span>
                        <input
                          value={settingsForm.contact?.email || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              contact: { ...prev.contact, email: event.target.value }
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>{isArabic ? "الهاتف" : "Phone"}</span>
                        <input
                          value={settingsForm.contact?.phone || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              contact: { ...prev.contact, phone: event.target.value }
                            }))
                          }
                        />
                      </label>
                    </div>
                    <LocalizedEditor
                      label={isArabic ? "العنوان الرسمي" : "Official Address"}
                      value={settingsForm.contact?.address || localizedTemplate}
                      multiline
                      onChange={(code, value) =>
                        setSettingsForm((prev) => ({
                          ...prev,
                          contact: {
                            ...prev.contact,
                            address: { ...(prev.contact?.address || localizedTemplate), [code]: value }
                          }
                        }))
                      }
                    />
                    <div className="dashboard-field-grid">
                      <label>
                        <span>Facebook</span>
                        <input
                          value={settingsForm.social?.facebook || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              social: { ...prev.social, facebook: event.target.value }
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>Instagram</span>
                        <input
                          value={settingsForm.social?.instagram || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              social: { ...prev.social, instagram: event.target.value }
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>LinkedIn</span>
                        <input
                          value={settingsForm.social?.linkedin || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              social: { ...prev.social, linkedin: event.target.value }
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="dashboard-field-grid">
                      <label>
                        <span>YouTube</span>
                        <input
                          value={settingsForm.social?.youtube || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              social: { ...prev.social, youtube: event.target.value }
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>{isArabic ? "اسم المستفيد في التبرع" : "Donation Beneficiary"}</span>
                        <input
                          value={settingsForm.donation?.beneficiary || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              donation: { ...prev.donation, beneficiary: event.target.value }
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>IBAN</span>
                        <input
                          value={settingsForm.donation?.iban || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              donation: { ...prev.donation, iban: event.target.value }
                            }))
                          }
                        />
                      </label>
                    </div>
                    <div className="dashboard-field-grid">
                      <label>
                        <span>BIC/SWIFT</span>
                        <input
                          value={settingsForm.donation?.bic || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              donation: { ...prev.donation, bic: event.target.value }
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>{isArabic ? "رقم التسجيل القانوني" : "Legal Registration"}</span>
                        <input
                          value={settingsForm.legal?.registrationNumber || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              legal: { ...prev.legal, registrationNumber: event.target.value }
                            }))
                          }
                        />
                      </label>
                      <label>
                        <span>{isArabic ? "المرجع الضريبي" : "Tax Reference"}</span>
                        <input
                          value={settingsForm.legal?.taxReference || ""}
                          onChange={(event) =>
                            setSettingsForm((prev) => ({
                              ...prev,
                              legal: { ...prev.legal, taxReference: event.target.value }
                            }))
                          }
                        />
                      </label>
                    </div>
                    <label>
                      <span>{isArabic ? "تاريخ آخر تحديث قانوني" : "Legal Update Date"}</span>
                      <input
                        type="date"
                        value={settingsForm.legal?.updatedAt || ""}
                        onChange={(event) =>
                          setSettingsForm((prev) => ({
                            ...prev,
                            legal: { ...prev.legal, updatedAt: event.target.value }
                          }))
                        }
                      />
                    </label>
                    <button className="btn btn-primary" type="submit" disabled={busy === "settings"}>
                      {busy === "settings" ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : isArabic ? "حفظ الإعدادات" : "Save Settings"}
                    </button>
                  </form>
                ) : null}

                {activeTab === "projects" ? (
                  <div className="admin-dual-grid">
                    <form className="surface-card admin-form" onSubmit={saveProject}>
                      <div className="admin-form-head">
                        <h3>{editingProjectId ? (isArabic ? "تعديل مشروع" : "Edit Project") : isArabic ? "مشروع جديد" : "New Project"}</h3>
                        {editingProjectId ? (
                          <button type="button" className="btn btn-outline-ink" onClick={resetProjectForm}>
                            {isArabic ? "إلغاء التعديل" : "Cancel Edit"}
                          </button>
                        ) : null}
                      </div>
                      <label>
                        <span>Slug</span>
                        <input value={projectForm.slug} onChange={(e) => setProjectForm((p) => ({ ...p, slug: e.target.value }))} />
                      </label>
                      <label>
                        <span>{isArabic ? "تاريخ التحديث" : "Updated Date"}</span>
                        <input
                          type="date"
                          value={projectForm.updatedAt || ""}
                          onChange={(e) => setProjectForm((p) => ({ ...p, updatedAt: e.target.value }))}
                        />
                      </label>
                      <LocalizedEditor label={isArabic ? "العنوان" : "Title"} value={projectForm.title} onChange={(c, v) => setProjectForm((p) => ({ ...p, title: { ...p.title, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "الفئة" : "Category"} value={projectForm.category} onChange={(c, v) => setProjectForm((p) => ({ ...p, category: { ...p.category, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "الحالة" : "Status"} value={projectForm.status} onChange={(c, v) => setProjectForm((p) => ({ ...p, status: { ...p.status, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "الملخص" : "Excerpt"} value={projectForm.excerpt} multiline onChange={(c, v) => setProjectForm((p) => ({ ...p, excerpt: { ...p.excerpt, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "الميزانية" : "Budget"} value={projectForm.budget} onChange={(c, v) => setProjectForm((p) => ({ ...p, budget: { ...p.budget, [c]: v } }))} />
                      <LocalizedEditor
                        label={isArabic ? "عدد المستفيدين" : "Beneficiaries"}
                        value={projectForm.beneficiaries}
                        onChange={(c, v) => setProjectForm((p) => ({ ...p, beneficiaries: { ...p.beneficiaries, [c]: v } }))}
                      />
                      <LocalizedEditor
                        label={isArabic ? "مجال التنفيذ" : "Implementation Area"}
                        value={projectForm.implementationArea}
                        onChange={(c, v) => setProjectForm((p) => ({ ...p, implementationArea: { ...p.implementationArea, [c]: v } }))}
                      />
                      <LocalizedEditor label={isArabic ? "الجدول الزمني" : "Timeline"} value={projectForm.timeline} onChange={(c, v) => setProjectForm((p) => ({ ...p, timeline: { ...p.timeline, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "الأهداف (كل سطر هدف)" : "Objectives (line by line)"} value={projectForm.objectives} multiline onChange={(c, v) => setProjectForm((p) => ({ ...p, objectives: { ...p.objectives, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "النتائج (كل سطر نتيجة)" : "Outcomes (line by line)"} value={projectForm.outcomes} multiline onChange={(c, v) => setProjectForm((p) => ({ ...p, outcomes: { ...p.outcomes, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "الشركاء (كل سطر جهة)" : "Partners (line by line)"} value={projectForm.partners} multiline onChange={(c, v) => setProjectForm((p) => ({ ...p, partners: { ...p.partners, [c]: v } }))} />
                      <div className="admin-form-actions">
                        <button className="btn btn-primary" type="submit" disabled={busy === "projects"}>
                          {busy === "projects" ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : isArabic ? "حفظ المشروع" : "Save Project"}
                        </button>
                        <button className="btn btn-outline-ink" type="button" onClick={resetProjectForm}>
                          {isArabic ? "تفريغ النموذج" : "Clear Form"}
                        </button>
                      </div>
                    </form>
                    <div className="surface-card admin-list-card">
                      <div className="admin-list-head">
                        <h3>{isArabic ? "قائمة المشاريع" : "Projects List"}</h3>
                        <span className="admin-list-count">
                          {filteredProjects.length}/{cms.projects.length}
                        </span>
                      </div>
                      <label className="admin-search-field">
                        <span>{isArabic ? "بحث في المشاريع" : "Search projects"}</span>
                        <input
                          value={projectQuery}
                          onChange={(event) => setProjectQuery(event.target.value)}
                          placeholder={isArabic ? "العنوان، الفئة، الحالة، أو Slug" : "Title, category, status, or slug"}
                        />
                      </label>
                      <div className="admin-list">
                        {filteredProjects.length ? (
                          filteredProjects.map((item) => (
                            <article className="admin-list-item" key={item.id}>
                              <h4>{previewLocalized(item.title, lang)}</h4>
                              <p>{previewLocalized(item.excerpt, lang)}</p>
                              <div className="admin-item-meta">
                                <span className="meta-chip">{previewLocalized(item.status, lang) || (isArabic ? "بدون حالة" : "No status")}</span>
                                <span>{formatShortDate(item.updatedAt, lang)}</span>
                              </div>
                              <div className="admin-inline-actions">
                                <button
                                  type="button"
                                  className="btn btn-outline-ink"
                                  onClick={() => {
                                    setEditingProjectId(item.id);
                                    setProjectForm({
                                      ...emptyProject(),
                                      ...item,
                                      objectives: toTextMap(item.objectives),
                                      outcomes: toTextMap(item.outcomes),
                                      partners: toTextMap(item.partners)
                                    });
                                  }}
                                >
                                  {isArabic ? "تعديل" : "Edit"}
                                </button>
                                <button type="button" className="btn btn-danger" disabled={busy === `project-${item.id}`} onClick={() => removeProject(item.id)}>
                                  {isArabic ? "حذف" : "Delete"}
                                </button>
                              </div>
                            </article>
                          ))
                        ) : (
                          <p className="admin-empty-state">{isArabic ? "لا توجد نتائج مطابقة لبحثك." : "No results match your search."}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === "news" ? (
                  <div className="admin-dual-grid">
                    <form className="surface-card admin-form" onSubmit={saveNews}>
                      <div className="admin-form-head">
                        <h3>{editingNewsId ? (isArabic ? "تعديل خبر" : "Edit News") : isArabic ? "خبر جديد" : "New News"}</h3>
                        {editingNewsId ? (
                          <button type="button" className="btn btn-outline-ink" onClick={resetNewsForm}>
                            {isArabic ? "إلغاء التعديل" : "Cancel Edit"}
                          </button>
                        ) : null}
                      </div>
                      <label>
                        <span>Slug</span>
                        <input value={newsForm.slug} onChange={(e) => setNewsForm((p) => ({ ...p, slug: e.target.value }))} />
                      </label>
                      <label>
                        <span>{isArabic ? "تاريخ النشر" : "Published Date"}</span>
                        <input type="date" value={newsForm.publishedAt || ""} onChange={(e) => setNewsForm((p) => ({ ...p, publishedAt: e.target.value }))} />
                      </label>
                      <LocalizedEditor label={isArabic ? "العنوان" : "Title"} value={newsForm.title} onChange={(c, v) => setNewsForm((p) => ({ ...p, title: { ...p.title, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "الملخص" : "Excerpt"} value={newsForm.excerpt} multiline onChange={(c, v) => setNewsForm((p) => ({ ...p, excerpt: { ...p.excerpt, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "المحتوى (سطر لكل فقرة)" : "Content (line by line)"} value={newsForm.content} multiline onChange={(c, v) => setNewsForm((p) => ({ ...p, content: { ...p.content, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "أهم النقاط (كل سطر نقطة)" : "Key Points (line by line)"} value={newsForm.keyPoints} multiline onChange={(c, v) => setNewsForm((p) => ({ ...p, keyPoints: { ...p.keyPoints, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "الكاتب/الوحدة" : "Author/Unit"} value={newsForm.author} onChange={(c, v) => setNewsForm((p) => ({ ...p, author: { ...p.author, [c]: v } }))} />
                      <div className="admin-form-actions">
                        <button className="btn btn-primary" type="submit" disabled={busy === "news"}>
                          {busy === "news" ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : isArabic ? "حفظ الخبر" : "Save News"}
                        </button>
                        <button className="btn btn-outline-ink" type="button" onClick={resetNewsForm}>
                          {isArabic ? "تفريغ النموذج" : "Clear Form"}
                        </button>
                      </div>
                    </form>
                    <div className="surface-card admin-list-card">
                      <div className="admin-list-head">
                        <h3>{isArabic ? "قائمة الأخبار" : "News List"}</h3>
                        <span className="admin-list-count">
                          {filteredNews.length}/{cms.news.length}
                        </span>
                      </div>
                      <label className="admin-search-field">
                        <span>{isArabic ? "بحث في الأخبار" : "Search news"}</span>
                        <input
                          value={newsQuery}
                          onChange={(event) => setNewsQuery(event.target.value)}
                          placeholder={isArabic ? "العنوان، الكاتب، المحتوى، أو Slug" : "Title, author, content, or slug"}
                        />
                      </label>
                      <div className="admin-list">
                        {filteredNews.length ? (
                          filteredNews.map((item) => (
                            <article className="admin-list-item" key={item.id}>
                              <h4>{previewLocalized(item.title, lang)}</h4>
                              <p>{previewLocalized(item.excerpt, lang)}</p>
                              <div className="admin-item-meta">
                                <span>{previewLocalized(item.author, lang) || (isArabic ? "بدون كاتب" : "No author")}</span>
                                <span>{formatShortDate(item.publishedAt, lang)}</span>
                              </div>
                              <div className="admin-inline-actions">
                                <button
                                  type="button"
                                  className="btn btn-outline-ink"
                                  onClick={() => {
                                    setEditingNewsId(item.id);
                                    setNewsForm({
                                      ...emptyNews(),
                                      ...item,
                                      content: toTextMap(item.content),
                                      keyPoints: toTextMap(item.keyPoints)
                                    });
                                  }}
                                >
                                  {isArabic ? "تعديل" : "Edit"}
                                </button>
                                <button type="button" className="btn btn-danger" disabled={busy === `news-${item.id}`} onClick={() => removeNews(item.id)}>
                                  {isArabic ? "حذف" : "Delete"}
                                </button>
                              </div>
                            </article>
                          ))
                        ) : (
                          <p className="admin-empty-state">{isArabic ? "لا توجد نتائج مطابقة لبحثك." : "No results match your search."}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === "pages" ? (
                  <div className="admin-dual-grid">
                    <form className="surface-card admin-form" onSubmit={savePage}>
                      <div className="admin-form-head">
                        <h3>{editingPageId ? (isArabic ? "تعديل صفحة" : "Edit Page") : isArabic ? "صفحة جديدة" : "New Page"}</h3>
                        {editingPageId ? (
                          <button type="button" className="btn btn-outline-ink" onClick={resetPageForm}>
                            {isArabic ? "إلغاء التعديل" : "Cancel Edit"}
                          </button>
                        ) : null}
                      </div>
                      <label>
                        <span>Slug</span>
                        <input value={pageForm.slug} onChange={(e) => setPageForm((p) => ({ ...p, slug: e.target.value }))} />
                      </label>
                      <label>
                        <span>{isArabic ? "الحالة" : "Status"}</span>
                        <select value={pageForm.status} onChange={(e) => setPageForm((p) => ({ ...p, status: e.target.value }))}>
                          <option value="published">{isArabic ? "منشورة" : "Published"}</option>
                          <option value="draft">{isArabic ? "مسودة" : "Draft"}</option>
                        </select>
                      </label>
                      <label>
                        <span>{isArabic ? "تاريخ النشر" : "Published Date"}</span>
                        <input
                          type="date"
                          value={pageForm.publishedAt || ""}
                          onChange={(e) => setPageForm((p) => ({ ...p, publishedAt: e.target.value }))}
                        />
                      </label>
                      <LocalizedEditor
                        label={isArabic ? "عنوان الصفحة" : "Page Title"}
                        value={pageForm.title}
                        onChange={(c, v) => setPageForm((p) => ({ ...p, title: { ...p.title, [c]: v } }))}
                      />
                      <LocalizedEditor
                        label={isArabic ? "ملخص الصفحة" : "Page Excerpt"}
                        value={pageForm.excerpt}
                        multiline
                        onChange={(c, v) => setPageForm((p) => ({ ...p, excerpt: { ...p.excerpt, [c]: v } }))}
                      />
                      <LocalizedEditor
                        label={isArabic ? "محتوى الصفحة (سطر لكل فقرة)" : "Page Content (line by line)"}
                        value={pageForm.content}
                        multiline
                        onChange={(c, v) => setPageForm((p) => ({ ...p, content: { ...p.content, [c]: v } }))}
                      />
                      <div className="admin-form-actions">
                        <button className="btn btn-primary" type="submit" disabled={busy === "pages"}>
                          {busy === "pages" ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : isArabic ? "حفظ الصفحة" : "Save Page"}
                        </button>
                        <button className="btn btn-outline-ink" type="button" onClick={resetPageForm}>
                          {isArabic ? "تفريغ النموذج" : "Clear Form"}
                        </button>
                      </div>
                    </form>

                    <div className="surface-card admin-list-card">
                      <div className="admin-list-head">
                        <h3>{isArabic ? "قائمة الصفحات" : "Pages List"}</h3>
                        <span className="admin-list-count">
                          {filteredPages.length}/{Array.isArray(cms.pages) ? cms.pages.length : 0}
                        </span>
                      </div>
                      <div className="admin-list-tools">
                        <label className="admin-search-field">
                          <span>{isArabic ? "بحث في الصفحات" : "Search pages"}</span>
                          <input
                            value={pageQuery}
                            onChange={(event) => setPageQuery(event.target.value)}
                            placeholder={isArabic ? "العنوان، الملخص، المحتوى، أو Slug" : "Title, excerpt, content, or slug"}
                          />
                        </label>
                        <label className="admin-filter-field">
                          <span>{isArabic ? "تصفية حسب الحالة" : "Filter by status"}</span>
                          <select value={pageStatusFilter} onChange={(event) => setPageStatusFilter(event.target.value)}>
                            <option value="all">{isArabic ? "الكل" : "All"}</option>
                            <option value="published">{isArabic ? "منشورة" : "Published"}</option>
                            <option value="draft">{isArabic ? "مسودة" : "Draft"}</option>
                          </select>
                        </label>
                      </div>
                      <div className="admin-list">
                        {filteredPages.length ? (
                          filteredPages.map((item) => (
                            <article className="admin-list-item" key={item.id}>
                              <h4>{previewLocalized(item.title, lang)}</h4>
                              <p>{previewLocalized(item.excerpt, lang)}</p>
                              <div className="admin-item-meta">
                                <span className="meta-chip">{String(item.status || "published").toLowerCase() === "published" ? (isArabic ? "منشورة" : "Published") : isArabic ? "مسودة" : "Draft"}</span>
                                <span>{formatShortDate(item.publishedAt, lang)}</span>
                              </div>
                              <div className="admin-inline-actions">
                                <button
                                  type="button"
                                  className="btn btn-outline-ink"
                                  onClick={() => {
                                    setEditingPageId(item.id);
                                    setPageForm({
                                      ...emptyPage(),
                                      ...item,
                                      content: toTextMap(item.content)
                                    });
                                  }}
                                >
                                  {isArabic ? "تعديل" : "Edit"}
                                </button>
                                {String(item.status || "published").toLowerCase() === "published" ? (
                                  <a className="btn btn-outline-ink" href={`/${lang}/pages/${item.slug}`} target="_blank" rel="noreferrer">
                                    {isArabic ? "فتح" : "Open"}
                                  </a>
                                ) : null}
                                <button type="button" className="btn btn-danger" disabled={busy === `page-${item.id}`} onClick={() => removePage(item.id)}>
                                  {isArabic ? "حذف" : "Delete"}
                                </button>
                              </div>
                            </article>
                          ))
                        ) : (
                          <p className="admin-empty-state">{isArabic ? "لا توجد نتائج مطابقة لبحثك." : "No results match your search."}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}

                {activeTab === "media" ? (
                  <div className="admin-dual-grid">
                    <form className="surface-card admin-form" onSubmit={saveMedia}>
                      <div className="admin-form-head">
                        <h3>{editingMediaId ? (isArabic ? "تعديل وسائط" : "Edit Media") : isArabic ? "وسائط جديدة" : "New Media"}</h3>
                        {editingMediaId ? (
                          <button type="button" className="btn btn-outline-ink" onClick={resetMediaForm}>
                            {isArabic ? "إلغاء التعديل" : "Cancel Edit"}
                          </button>
                        ) : null}
                      </div>
                      <label><span>Slug</span><input value={mediaForm.slug} onChange={(e) => setMediaForm((p) => ({ ...p, slug: e.target.value }))} /></label>
                      <label>
                        <span>{isArabic ? "النوع" : "Type"}</span>
                        <select value={mediaForm.type} onChange={(e) => setMediaForm((p) => ({ ...p, type: e.target.value }))}>
                          <option value="image">{isArabic ? "صورة" : "Image"}</option>
                          <option value="video">{isArabic ? "فيديو" : "Video"}</option>
                          <option value="document">{isArabic ? "وثيقة" : "Document"}</option>
                          <option value="audio">{isArabic ? "صوت" : "Audio"}</option>
                        </select>
                      </label>
                      <LocalizedEditor label={isArabic ? "العنوان" : "Title"} value={mediaForm.title} onChange={(c, v) => setMediaForm((p) => ({ ...p, title: { ...p.title, [c]: v } }))} />
                      <LocalizedEditor label={isArabic ? "الوصف" : "Description"} value={mediaForm.description} multiline onChange={(c, v) => setMediaForm((p) => ({ ...p, description: { ...p.description, [c]: v } }))} />
                      <label><span>{isArabic ? "الرابط" : "URL"}</span><input value={mediaForm.url} onChange={(e) => setMediaForm((p) => ({ ...p, url: e.target.value }))} required /></label>
                      <label><span>{isArabic ? "الصورة المصغرة" : "Thumbnail URL"}</span><input value={mediaForm.thumbnail} onChange={(e) => setMediaForm((p) => ({ ...p, thumbnail: e.target.value }))} /></label>
                      <div className="admin-form-actions">
                        <button className="btn btn-primary" type="submit" disabled={busy === "media"}>
                          {busy === "media" ? (isArabic ? "جارٍ الحفظ..." : "Saving...") : isArabic ? "حفظ الوسائط" : "Save Media"}
                        </button>
                        <button className="btn btn-outline-ink" type="button" onClick={resetMediaForm}>
                          {isArabic ? "تفريغ النموذج" : "Clear Form"}
                        </button>
                      </div>
                    </form>
                    <div className="surface-card admin-list-card">
                      <div className="admin-list-head">
                        <h3>{isArabic ? "قائمة الوسائط" : "Media List"}</h3>
                        <span className="admin-list-count">
                          {filteredMedia.length}/{cms.media.length}
                        </span>
                      </div>
                      <div className="admin-list-tools">
                        <label className="admin-search-field">
                          <span>{isArabic ? "بحث في الوسائط" : "Search media"}</span>
                          <input
                            value={mediaQuery}
                            onChange={(event) => setMediaQuery(event.target.value)}
                            placeholder={isArabic ? "العنوان، الوصف، الرابط، أو Slug" : "Title, description, URL, or slug"}
                          />
                        </label>
                        <label className="admin-filter-field">
                          <span>{isArabic ? "تصفية حسب النوع" : "Filter by type"}</span>
                          <select value={mediaTypeFilter} onChange={(event) => setMediaTypeFilter(event.target.value)}>
                            <option value="all">{isArabic ? "الكل" : "All"}</option>
                            <option value="image">{isArabic ? "صور" : "Images"}</option>
                            <option value="video">{isArabic ? "فيديو" : "Video"}</option>
                            <option value="document">{isArabic ? "وثائق" : "Documents"}</option>
                            <option value="audio">{isArabic ? "صوتيات" : "Audio"}</option>
                          </select>
                        </label>
                      </div>
                      <div className="admin-list">
                        {filteredMedia.length ? (
                          filteredMedia.map((item) => (
                            <article className="admin-list-item" key={item.id}>
                              <h4>{previewLocalized(item.title, lang)}</h4>
                              <p>{previewLocalized(item.description, lang) || item.url}</p>
                              <div className="admin-item-meta">
                                <span className="meta-chip">{item.type}</span>
                                <a className="admin-list-link" href={item.url} target="_blank" rel="noreferrer">
                                  {isArabic ? "فتح الرابط" : "Open URL"}
                                </a>
                              </div>
                              <div className="admin-inline-actions">
                                <button
                                  type="button"
                                  className="btn btn-outline-ink"
                                  onClick={() => {
                                    setEditingMediaId(item.id);
                                    setMediaForm({
                                      ...emptyMedia(),
                                      ...item,
                                      description: toTextMap(item.description)
                                    });
                                  }}
                                >
                                  {isArabic ? "تعديل" : "Edit"}
                                </button>
                                <button type="button" className="btn btn-danger" disabled={busy === `media-${item.id}`} onClick={() => removeMedia(item.id)}>
                                  {isArabic ? "حذف" : "Delete"}
                                </button>
                              </div>
                            </article>
                          ))
                        ) : (
                          <p className="admin-empty-state">{isArabic ? "لا توجد نتائج مطابقة لبحثك." : "No results match your search."}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
                  </>
                ) : null}
              </div>
            </div>
          </div>
        )}
      </section>

      {toasts.length > 0 && (
        <div className="admin-toast">
          {toasts.map((t) => (
            <div key={t.id} className={`admin-toast-item is-${t.type}`}>
              {t.type === "success" ? (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><path d="M22 4L12 14.01l-3-3" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>
              )}
              {t.msg}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
