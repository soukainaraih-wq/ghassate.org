import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildPath } from "../i18n/content";

const STORAGE_KEY = "ghassate_cookie_consent";

const copy = {
  ar: {
    title: "إشعار ملفات تعريف الارتباط",
    text:
      "نستخدم ملفات تعريف الارتباط الضرورية لتحسين التجربة، ومع موافقتك يمكننا تفعيل ملفات تحليل الأداء.",
    accept: "موافقة على الكل",
    essential: "قبول الضروري فقط",
    privacy: "سياسة الخصوصية",
    close: "إغلاق"
  },
  zgh: {
    title: "Aselkin n Cookies",
    text:
      "Nseqdac cookies i ilaqen i userfed n tirmit. S umewafaq nnek ad nermed cookies n usleḍ.",
    accept: "Qbel akk",
    essential: "Qbel ayen ilaqen kan",
    privacy: "Tasertit n tba3diyt",
    close: "Mdel"
  },
  en: {
    title: "Cookie Notice",
    text:
      "We use essential cookies to keep the platform functional. With your consent, we also enable analytics cookies.",
    accept: "Accept all",
    essential: "Essential only",
    privacy: "Privacy policy",
    close: "Close"
  }
};

export default function CookieConsentModal({ lang }) {
  const [visible, setVisible] = useState(false);
  const t = copy[lang] || copy.ar;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
    }
  }, []);

  function setConsent(value) {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, value);
    }
    setVisible(false);
  }

  if (!visible) {
    return null;
  }

  return (
    <div className="cookie-modal" role="dialog" aria-modal="true" aria-label={t.title}>
      <div className="cookie-modal-card">
        <button
          type="button"
          className="cookie-close"
          aria-label={t.close}
          onClick={() => setConsent("essential")}
        >
          ×
        </button>
        <h3>{t.title}</h3>
        <p>{t.text}</p>
        <div className="cookie-actions">
          <button type="button" className="btn btn-primary" onClick={() => setConsent("accepted")}>
            {t.accept}
          </button>
          <button type="button" className="btn btn-outline-ink" onClick={() => setConsent("essential")}>
            {t.essential}
          </button>
          <Link className="text-link" to={buildPath(lang, "privacy-policy")}>
            {t.privacy}
          </Link>
        </div>
      </div>
    </div>
  );
}
