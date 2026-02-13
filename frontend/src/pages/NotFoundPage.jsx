import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import Seo from "../components/Seo";
import { buildPath } from "../i18n/content";

export default function NotFoundPage() {
  const { lang } = useOutletContext();
  const isArabic = lang !== "en";

  return (
    <>
      <Seo
        lang={lang}
        title={isArabic ? "الصفحة غير موجودة" : "Page not found"}
        description={
          isArabic
            ? "الصفحة المطلوبة غير متاحة حاليًا."
            : "The requested page is currently unavailable."
        }
        slug=""
        noindex
      />
      <section className="section">
        <div className="container centered error-panel">
          <span className="error-code">404</span>
          <h1>{isArabic ? "الصفحة غير موجودة" : "Page Not Found"}</h1>
          <p>
            {isArabic
              ? "الرابط الذي طلبته غير صحيح أو تم نقله."
              : "The requested link is invalid or has been moved."}
          </p>
          <Link className="btn btn-primary" to={buildPath(lang)}>
            {isArabic ? "العودة للرئيسية" : "Back to Home"}
          </Link>
        </div>
      </section>
    </>
  );
}
