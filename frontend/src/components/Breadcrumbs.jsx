import React from "react";
import { Link } from "react-router-dom";
import { buildPath } from "../i18n/content";

export default function Breadcrumbs({ lang, items = [] }) {
  const labels = {
    ar: { home: "الرئيسية", aria: "مسار التصفح" },
    zgh: { home: "Asebter agejdan", aria: "Abrid n usebter" },
    en: { home: "Home", aria: "Breadcrumb" }
  };
  const t = labels[lang] || labels.ar;

  return (
    <nav className="breadcrumbs" aria-label={t.aria}>
      <Link to={buildPath(lang)}>{t.home}</Link>
      {items.map((item) => (
        <React.Fragment key={item.to || item.label}>
          <span aria-hidden="true">/</span>
          {item.to ? <Link to={item.to}>{item.label}</Link> : <span>{item.label}</span>}
        </React.Fragment>
      ))}
    </nav>
  );
}
