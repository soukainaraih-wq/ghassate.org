import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { SITE_ORIGIN, buildPath } from "../i18n/content";
import { getPageBySlug } from "../lib/api";

export default function PageDetailsPage() {
  const { lang, content } = useOutletContext();
  const { slug } = useParams();
  const isArabic = lang !== "en";
  const [page, setPage] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getPageBySlug(lang, slug)
      .then((response) => {
        if (!mounted) {
          return;
        }
        setPage(response);
        setError("");
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setError(isArabic ? "الصفحة غير موجودة." : "Page not found.");
      });

    return () => {
      mounted = false;
    };
  }, [isArabic, lang, slug]);

  const pageTitle = page
    ? `${page.title} | ${content.siteName}`
    : isArabic
      ? "صفحة محتوى | مؤسسة غسات الكبرى"
      : "Content Page | Ghassate Organization";

  const pageDescription =
    page?.excerpt ||
    (isArabic ? "صفحة محتوى منشورة من لوحة التحكم." : "Published content page from the CMS dashboard.");

  const schema = useMemo(() => {
    if (!page) {
      return null;
    }

    return {
      "@context": "https://schema.org",
      "@type": "WebPage",
      name: page.title,
      description: page.excerpt,
      url: `${SITE_ORIGIN}${buildPath(lang, `pages/${page.slug}`)}`,
      datePublished: page.publishedAtIso,
      dateModified: page.updatedAtIso || page.publishedAtIso
    };
  }, [lang, page]);

  return (
    <>
      <Seo
        lang={lang}
        title={pageTitle}
        description={pageDescription}
        slug={`pages/${slug}`}
        schemaType="WebPage"
        breadcrumbs={[
          { name: isArabic ? "الصفحات" : "Pages", slug: "pages" },
          { name: page?.title || (isArabic ? "صفحة" : "Page"), slug: `pages/${slug}` }
        ]}
        publishedTime={page?.publishedAtIso}
        modifiedTime={page?.updatedAtIso || page?.publishedAtIso}
        extraSchemas={schema ? [schema] : []}
      />

      <section className="section">
        <div className="container">
          <Breadcrumbs
            lang={lang}
            items={[
              { label: isArabic ? "الصفحات" : "Pages" },
              { label: page?.title || (isArabic ? "صفحة" : "Page") }
            ]}
          />
          {error ? <p className="form-message error">{error}</p> : null}
        </div>

        {page ? (
          <div className="container article-shell">
            <article className="surface-card article-main">
              <span className="meta-chip">{isArabic ? "صفحة منشورة" : "Published Page"}</span>
              <h1 className="section-title">{page.title}</h1>
              <p className="section-copy">{page.excerpt}</p>
              {Array.isArray(page.content)
                ? page.content.map((paragraph) => <p key={`paragraph-${paragraph}`}>{paragraph}</p>)
                : null}
              <p className="meta-note">
                {isArabic ? "تاريخ النشر:" : "Published on:"}{" "}
                <time dateTime={page.publishedAtIso}>{page.publishedAt}</time>
              </p>
              <div className="cta-inline">
                <Link className="btn btn-primary" to={buildPath(lang)}>
                  {isArabic ? "العودة للرئيسية" : "Back to Home"}
                </Link>
              </div>
            </article>
          </div>
        ) : (
          <div className="container">{!error ? <p>{content.common.loading}</p> : null}</div>
        )}
      </section>
    </>
  );
}

