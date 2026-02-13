import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation, useParams } from "react-router-dom";
import { getContent, isValidLang } from "../i18n/content";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import CookieConsentModal from "./CookieConsentModal";
import MembershipPrompt from "./MembershipPrompt";
import { getSiteSettings } from "../lib/api";
import { DASHBOARD_SECRET_PATH } from "../lib/runtime-config";

export default function PageShell() {
  const { lang } = useParams();
  const location = useLocation();
  const [siteSettings, setSiteSettings] = useState(null);

  if (!isValidLang(lang)) {
    return <Navigate to="/ar" replace />;
  }

  const content = getContent(lang);
  const relativePath = location.pathname.replace(new RegExp(`^/${lang}`), "") || "";
  const isDashboardArea = Boolean(DASHBOARD_SECRET_PATH) && relativePath === `/${DASHBOARD_SECRET_PATH}`;
  const skipLabels = {
    ar: "تجاوز إلى المحتوى",
    zgh: "Zgel ɣer ugbur",
    en: "Skip to content"
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ghassate_preferred_lang", lang);
    }
  }, [lang]);

  useEffect(() => {
    let mounted = true;

    getSiteSettings(lang)
      .then((response) => {
        if (!mounted) {
          return;
        }

        setSiteSettings(response.settings || null);
      })
      .catch(() => {
        if (mounted) {
          setSiteSettings(null);
        }
      });

    return () => {
      mounted = false;
    };
  }, [lang]);

  return (
    <div className={`app-root ${lang === "en" ? "is-en" : ""}`} dir={content.dir}>
      <a className="skip-link" href="#site-main-content">
        {skipLabels[lang] || skipLabels.ar}
      </a>
      {!isDashboardArea ? <SiteHeader lang={lang} content={content} relativePath={relativePath} siteSettings={siteSettings} /> : null}
      <main id="site-main-content" className="site-main">
        <Outlet context={{ lang, content, relativePath, siteSettings }} />
      </main>
      {!isDashboardArea ? <MembershipPrompt lang={lang} relativePath={relativePath} /> : null}
      {!isDashboardArea ? <CookieConsentModal lang={lang} /> : null}
      {!isDashboardArea ? <SiteFooter lang={lang} content={content} siteSettings={siteSettings} /> : null}
    </div>
  );
}
