import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { SITE_ORIGIN, buildPath } from "../i18n/content";
import { getNewsBySlug } from "../lib/api";

export default function NewsDetailsPage() {
  const { lang, content } = useOutletContext();
  const { slug } = useParams();
  const isArabic = lang !== "en";
  const [item, setItem] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getNewsBySlug(lang, slug)
      .then((response) => {
        if (!mounted) {
          return;
        }
        setItem(response);
        setError("");
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setError(isArabic ? "الخبر غير موجود." : "News item not found.");
      });

    return () => {
      mounted = false;
    };
  }, [isArabic, lang, slug]);

  const pageTitle = item
    ? `${item.title} | ${content.siteName}`
    : isArabic
      ? "تفاصيل الخبر | مؤسسة غسات الكبرى"
      : "News Details | Ghassate Organization";

  const pageDescription =
    item?.excerpt ||
    (isArabic
      ? "تفاصيل الخبر الرسمي وآخر المستجدات المتعلقة بالمؤسسة."
      : "Official news details and latest institutional updates.");

  const articleSchema = useMemo(() => {
    if (!item) {
      return null;
    }

    return {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: item.title,
      description: item.excerpt,
      author: {
        "@type": "Organization",
        name: item.author
      },
      publisher: {
        "@type": "Organization",
        name: "Ghassate Organization",
        logo: {
          "@type": "ImageObject",
          url: `${SITE_ORIGIN}/favicon.svg`
        }
      },
      datePublished: item.publishedAtIso,
      dateModified: item.publishedAtIso,
      mainEntityOfPage: `${SITE_ORIGIN}${buildPath(lang, `news/${item.slug}`)}`
    };
  }, [item, lang]);

  return (
    <>
      <Seo
        lang={lang}
        title={pageTitle}
        description={pageDescription}
        slug={`news/${slug}`}
        schemaType="WebPage"
        type="article"
        breadcrumbs={[
          { name: isArabic ? "الأخبار" : "News", slug: "news" },
          { name: item?.title || (isArabic ? "تفاصيل الخبر" : "News details"), slug: `news/${slug}` }
        ]}
        publishedTime={item?.publishedAtIso}
        modifiedTime={item?.publishedAtIso}
        extraSchemas={articleSchema ? [articleSchema] : []}
      />

      <section className="section">
        <div className="container">
          <Breadcrumbs
            lang={lang}
            items={[
              { label: isArabic ? "الأخبار" : "News", to: buildPath(lang, "news") },
              { label: item?.title || (isArabic ? "تفاصيل الخبر" : "News details") }
            ]}
          />
          {error ? <p className="form-message error">{error}</p> : null}
        </div>

        {item ? (
          <div className="container article-shell">
            <article className="surface-card article-main">
              <span className="meta-chip">
                {isArabic ? "بقلم:" : "By:"} {item.author}
              </span>
              <h1 className="section-title">{item.title}</h1>
              <p className="section-copy">{item.excerpt}</p>
              {item.keyPoints?.length ? (
                <ul className="project-list">
                  {item.keyPoints.map((point) => (
                    <li key={`keypoint-${point}`}>{point}</li>
                  ))}
                </ul>
              ) : null}
              {item.content?.map((paragraph) => (
                <p key={`paragraph-${paragraph}`}>{paragraph}</p>
              ))}
              <p className="meta-note">
                {isArabic ? "تاريخ النشر:" : "Published on:"}{" "}
                <time dateTime={item.publishedAtIso}>{item.publishedAt}</time>
              </p>
              <div className="cta-inline">
                <Link className="btn btn-primary" to={buildPath(lang, "news")}>
                  {isArabic ? "العودة إلى الأخبار" : "Back to News"}
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
