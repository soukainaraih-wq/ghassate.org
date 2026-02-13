import React, { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { buildPath } from "../i18n/content";
import { getNews } from "../lib/api";

export default function NewsPage() {
  const { lang, content } = useOutletContext();
  const isArabic = lang !== "en";
  const [news, setNews] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getNews(lang)
      .then((response) => {
        if (mounted) {
          setNews(response.items);
          setError("");
        }
      })
      .catch(() => {
        if (mounted) {
          setError(
            isArabic
              ? "تعذر تحميل الأخبار حاليًا."
              : "News cannot be loaded right now."
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [isArabic, lang]);

  const featured = news[0];
  const title = isArabic ? "الأخبار | مؤسسة غسات الكبرى" : "News | Ghassate Organization";
  const description = isArabic
    ? "آخر الأخبار والتحديثات الرسمية حول المشاريع، الشراكات، والأنشطة الميدانية."
    : "Official updates on projects, partnerships, and field operations.";

  return (
    <>
      <Seo
        lang={lang}
        title={title}
        description={description}
        slug="news"
        schemaType="Blog"
        type="article"
        breadcrumbs={[{ name: isArabic ? "الأخبار" : "News", slug: "news" }]}
        modifiedTime={featured?.publishedAtIso}
      />
      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: isArabic ? "الأخبار" : "News" }]} />
          <div className="section-top">
            <span className="section-tag">{isArabic ? "غرفة الأخبار" : "Newsroom"}</span>
            <h1 className="section-title">{content.nav.news}</h1>
            <p className="section-copy">{description}</p>
          </div>
        </div>

        <div className="container">
          {featured ? (
            <article className="feature-news-card">
              <time dateTime={featured.publishedAtIso}>{featured.publishedAt}</time>
              <h2>
                <Link to={buildPath(lang, `news/${featured.slug}`)}>{featured.title}</Link>
              </h2>
              <p>{featured.excerpt}</p>
              {featured.keyPoints?.length ? (
                <ul className="project-list">
                  {featured.keyPoints.slice(0, 3).map((point) => (
                    <li key={`featured-point-${point}`}>{point}</li>
                  ))}
                </ul>
              ) : null}
              <span className="meta-chip">
                {isArabic ? "بقلم:" : "By:"} {featured.author}
              </span>
              <div className="cta-inline">
                <Link className="text-link" to={buildPath(lang, `news/${featured.slug}`)}>
                  {isArabic ? "قراءة التفاصيل" : "Read details"}
                </Link>
              </div>
            </article>
          ) : null}
        </div>

        <div className="container cards-grid grid-3">
          {error ? <p className="form-message error">{error}</p> : null}
          {!error && news.length === 0 ? <p>{content.common.loading}</p> : null}

          {news.slice(1).map((item) => (
            <article className="surface-card news-card" key={item.id}>
              <time dateTime={item.publishedAtIso}>{item.publishedAt}</time>
              <h3>
                <Link to={buildPath(lang, `news/${item.slug}`)}>{item.title}</Link>
              </h3>
              <p>{item.excerpt}</p>
              {item.keyPoints?.length ? (
                <ul className="project-list">
                  {item.keyPoints.slice(0, 2).map((point) => (
                    <li key={`news-point-${item.id}-${point}`}>{point}</li>
                  ))}
                </ul>
              ) : null}
              <p className="meta-note">
                {isArabic ? "بقلم:" : "By:"} {item.author}
              </p>
              <Link className="text-link" to={buildPath(lang, `news/${item.slug}`)}>
                {isArabic ? "تفاصيل الخبر" : "News details"}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
