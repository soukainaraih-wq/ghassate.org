import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { buildPath } from "../i18n/content";

const STORAGE_KEY = "ghassate_membership_prompt_closed";

const copy = {
  ar: {
    title: "انخرط معنا",
    text: "كن جزءًا من شبكة المؤسسة: تطوع، شراكة، أو دعم مباشر.",
    cta: "صفحة الانخراط",
    close: "إغلاق"
  },
  zgh: {
    title: "Kcem d ameddukal",
    text: "Ili d yiwen seg uzeṭṭa n tsudest: tawuri, aceṭṭaṛ, neɣ tawsa.",
    cta: "Asebter n unekcum",
    close: "Mdel"
  },
  en: {
    title: "Join Us",
    text: "Become part of our network through volunteering, partnership, or direct contribution.",
    cta: "Membership page",
    close: "Close"
  }
};

export default function MembershipPrompt({ lang, relativePath }) {
  const [visible, setVisible] = useState(false);
  const t = copy[lang] || copy.ar;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    const closed = window.localStorage.getItem(STORAGE_KEY);
    setVisible(!closed);
  }, []);

  if (!visible || relativePath === "/membership") {
    return null;
  }

  function closePrompt() {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, "1");
    }
    setVisible(false);
  }

  return (
    <aside className="membership-prompt" aria-label={t.title}>
      <button type="button" className="membership-close" aria-label={t.close} onClick={closePrompt}>
        ×
      </button>
      <div className="membership-icon" aria-hidden="true">
        ★
      </div>
      <h4>{t.title}</h4>
      <p>{t.text}</p>
      <Link className="btn btn-primary" to={buildPath(lang, "membership")}>
        {t.cta}
      </Link>
    </aside>
  );
}
