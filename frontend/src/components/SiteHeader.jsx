import React, { useMemo, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { buildPath, getLanguageOptions } from "../i18n/content";

const navMap = [
  { key: "home", slug: "" },
  { key: "about", slug: "about" },
  { key: "team", slug: "team" },
  { key: "projects", slug: "projects" },
  { key: "news", slug: "news" },
  { key: "integrity", slug: "integrity-charter" },
  { key: "contact", slug: "contact" }
];

export default function SiteHeader({ lang, content, relativePath, siteSettings }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const navId = useMemo(() => `main-nav-${lang}`, [lang]);
  const languageOptions = getLanguageOptions();
  const headerContact = [siteSettings?.contact?.email, siteSettings?.contact?.phone]
    .filter(Boolean)
    .join(" | ");
  const labels = {
    ar: {
      top: "اللغة العربية هي اللغة الرسمية للموقع",
      openMenu: "فتح القائمة",
      mainNav: "التنقل الرئيسي"
    },
    zgh: {
      top: "Tutlayt ta3rabt d tutlayt tagejdant n usmel",
      openMenu: "Ldi umuɣ",
      mainNav: "Asnirem agejdan"
    },
    en: {
      top: "Arabic is the primary language of this website",
      openMenu: "Open menu",
      mainNav: "Main navigation"
    }
  };
  const t = labels[lang] || labels.ar;

  function rememberLanguage(selectedLang) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("ghassate_preferred_lang", selectedLang);
    }
  }

  return (
    <header className="site-header">
      <div className="top-strip">
        <div className="container top-strip-inner">
          <span>{t.top}</span>
          <span className="top-strip-contact">
            {headerContact || "contact@ghassate.org | +212 6 00 00 00 00"}
          </span>
        </div>
      </div>

      <div className="container nav-bar">
        <Link className="brand" to={buildPath(lang)} onClick={() => setMenuOpen(false)}>
          <span className="brand-mark">GO</span>
          <span className="brand-text">
            <strong>{content.siteName}</strong>
            <small>{content.siteNameAmazigh}</small>
          </span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label={t.openMenu}
          aria-expanded={menuOpen}
          aria-controls={navId}
          onClick={() => setMenuOpen((value) => !value)}
        >
          <span />
          <span />
          <span />
        </button>

        <nav
          id={navId}
          className={`main-nav ${menuOpen ? "is-open" : ""}`}
          aria-label={t.mainNav}
        >
          {navMap.map((item) => (
            <NavLink
              key={item.key}
              to={buildPath(lang, item.slug)}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              end={!item.slug}
              onClick={() => setMenuOpen(false)}
            >
              {content.nav[item.key]}
            </NavLink>
          ))}
          <Link
            className="btn btn-primary mobile-donate"
            to={buildPath(lang, "donate")}
            onClick={() => setMenuOpen(false)}
          >
            {content.nav.donate}
          </Link>
          <Link
            className="btn btn-outline-ink mobile-join"
            to={buildPath(lang, "membership")}
            onClick={() => setMenuOpen(false)}
          >
            {content.nav.membership}
          </Link>
          <div className="mobile-lang-switch" aria-label="language switch">
            {languageOptions.map((option) => (
              <Link
                key={`mobile-${option.code}`}
                className={`lang-link ${option.code === lang ? "active" : ""}`}
                to={buildPath(option.code, relativePath)}
                onClick={() => {
                  rememberLanguage(option.code);
                  setMenuOpen(false);
                }}
              >
                {option.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="nav-actions">
          <div className="lang-picker">
            {languageOptions.map((option) => (
              <Link
                key={option.code}
                className={`lang-link ${option.code === lang ? "active" : ""}`}
                to={buildPath(option.code, relativePath)}
                onClick={() => {
                  rememberLanguage(option.code);
                  setMenuOpen(false);
                }}
              >
                {option.label}
              </Link>
            ))}
          </div>
          <Link className="btn btn-outline-ink" to={buildPath(lang, "membership")}>
            {content.nav.membership}
          </Link>
          <Link className="btn btn-primary" to={buildPath(lang, "donate")}>
            {content.nav.donate}
          </Link>
        </div>
      </div>
    </header>
  );
}
