import React, { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import PageShell from "./components/PageShell";
import HomePage from "./pages/HomePage";
import AboutPage from "./pages/AboutPage";
import ProjectsPage from "./pages/ProjectsPage";
import ProjectDetailsPage from "./pages/ProjectDetailsPage";
import NewsPage from "./pages/NewsPage";
import NewsDetailsPage from "./pages/NewsDetailsPage";
import PageDetailsPage from "./pages/PageDetailsPage";
import ContactPage from "./pages/ContactPage";
import DonatePage from "./pages/DonatePage";
import NotFoundPage from "./pages/NotFoundPage";
import TeamPage from "./pages/TeamPage";
import IntegrityPage from "./pages/IntegrityPage";
import PrivacyPage from "./pages/PrivacyPage";
import MembershipPage from "./pages/MembershipPage";
import { DASHBOARD_ENABLED, DASHBOARD_SECRET_PATH } from "./lib/runtime-config";

const LANG_STORAGE_KEY = "ghassate_preferred_lang";
const DashboardPage = lazy(() => import("./pages/DashboardPage"));

function isArabicTimezone(timezone) {
  return /^(Africa\/(Casablanca|Algiers|Tunis|Tripoli|Cairo|Khartoum)|Asia\/(Riyadh|Dubai|Baghdad|Amman|Beirut|Kuwait|Qatar|Bahrain|Muscat|Aden|Damascus))$/.test(
    timezone
  );
}

function resolveDefaultLanguage() {
  if (typeof window === "undefined") {
    return "ar";
  }

  const stored = window.localStorage.getItem(LANG_STORAGE_KEY);
  if (stored === "ar" || stored === "zgh" || stored === "en") {
    return stored;
  }

  const localeCandidates = [
    ...(Array.isArray(navigator.languages) ? navigator.languages : []),
    navigator.language
  ]
    .filter(Boolean)
    .map((value) => value.toLowerCase());

  if (localeCandidates.some((value) => value.startsWith("ar"))) {
    return "ar";
  }

  if (localeCandidates.some((value) => value.startsWith("zgh") || value.startsWith("tzm"))) {
    return "zgh";
  }

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  if (isArabicTimezone(timezone)) {
    return "ar";
  }

  return localeCandidates.some((value) => value.startsWith("en")) ? "en" : "ar";
}

function LanguageRedirect() {
  const defaultLang = resolveDefaultLanguage();
  return <Navigate to={`/${defaultLang}`} replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LanguageRedirect />} />
      <Route path="/:lang" element={<PageShell />}>
        <Route index element={<HomePage />} />
        <Route path="about" element={<AboutPage />} />
        <Route path="team" element={<TeamPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:slug" element={<ProjectDetailsPage />} />
        <Route path="news" element={<NewsPage />} />
        <Route path="news/:slug" element={<NewsDetailsPage />} />
        <Route path="pages/:slug" element={<PageDetailsPage />} />
        <Route path="integrity-charter" element={<IntegrityPage />} />
        <Route path="membership" element={<MembershipPage />} />
        <Route path="privacy-policy" element={<PrivacyPage />} />
        {DASHBOARD_ENABLED && DASHBOARD_SECRET_PATH ? (
          <Route
            path={DASHBOARD_SECRET_PATH}
            element={
              <Suspense fallback={null}>
                <DashboardPage />
              </Suspense>
            }
          />
        ) : null}
        <Route path="contact" element={<ContactPage />} />
        <Route path="donate" element={<DonatePage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/ar" replace />} />
    </Routes>
  );
}
