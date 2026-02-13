import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext, useParams } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { SITE_ORIGIN, buildPath } from "../i18n/content";
import { getProjectBySlug } from "../lib/api";

export default function ProjectDetailsPage() {
  const { lang, content } = useOutletContext();
  const { slug } = useParams();
  const isArabic = lang !== "en";
  const [project, setProject] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getProjectBySlug(lang, slug)
      .then((response) => {
        if (!mounted) {
          return;
        }
        setProject(response);
        setError("");
      })
      .catch(() => {
        if (!mounted) {
          return;
        }
        setError(isArabic ? "المشروع غير موجود." : "Project not found.");
      });

    return () => {
      mounted = false;
    };
  }, [isArabic, lang, slug]);

  const pageTitle = project
    ? `${project.title} | ${content.siteName}`
    : isArabic
      ? "تفاصيل المشروع | مؤسسة غسات الكبرى"
      : "Project Details | Ghassate Organization";

  const pageDescription =
    project?.excerpt ||
    (isArabic
      ? "تفاصيل المشروع، مؤشرات التنفيذ، والبيانات الأساسية."
      : "Project details, execution indicators, and core data.");

  const projectSchema = useMemo(() => {
    if (!project) {
      return null;
    }

    return {
      "@context": "https://schema.org",
      "@type": "Project",
      name: project.title,
      description: project.excerpt,
      url: `${SITE_ORIGIN}${buildPath(lang, `projects/${project.slug}`)}`,
      dateModified: project.updatedAtIso,
      provider: {
        "@type": "Organization",
        name: "Ghassate Organization"
      }
    };
  }, [lang, project]);

  return (
    <>
      <Seo
        lang={lang}
        title={pageTitle}
        description={pageDescription}
        slug={`projects/${slug}`}
        schemaType="WebPage"
        breadcrumbs={[
          { name: isArabic ? "المشاريع" : "Projects", slug: "projects" },
          { name: project?.title || (isArabic ? "تفاصيل المشروع" : "Project details"), slug: `projects/${slug}` }
        ]}
        modifiedTime={project?.updatedAtIso}
        extraSchemas={projectSchema ? [projectSchema] : []}
      />

      <section className="section">
        <div className="container">
          <Breadcrumbs
            lang={lang}
            items={[
              { label: isArabic ? "المشاريع" : "Projects", to: buildPath(lang, "projects") },
              { label: project?.title || (isArabic ? "تفاصيل المشروع" : "Project details") }
            ]}
          />
          {error ? <p className="form-message error">{error}</p> : null}
        </div>

        {project ? (
          <div className="container details-grid">
            <article className="surface-card detail-main">
              <span className="meta-chip">{project.category}</span>
              <h1 className="section-title">{project.title}</h1>
              <p className="section-copy">{project.excerpt}</p>
              <p className="meta-note">
                {isArabic ? "آخر تحديث:" : "Last update:"}{" "}
                <time dateTime={project.updatedAtIso}>{project.updatedAt}</time>
              </p>

              <div className="cards-grid grid-2">
                <article className="surface-card">
                  <h3>{isArabic ? "أهداف المشروع" : "Project Objectives"}</h3>
                  <ul className="project-list">
                    {project.objectives?.map((point) => (
                      <li key={`objective-${point}`}>{point}</li>
                    ))}
                  </ul>
                </article>
                <article className="surface-card">
                  <h3>{isArabic ? "نتائج محققة" : "Documented Outcomes"}</h3>
                  <ul className="project-list">
                    {project.outcomes?.map((point) => (
                      <li key={`outcome-${point}`}>{point}</li>
                    ))}
                  </ul>
                </article>
              </div>

              <div className="cta-inline">
                <Link className="btn btn-primary" to={buildPath(lang, "donate")}>
                  {isArabic ? "ادعم هذا المشروع" : "Support this project"}
                </Link>
                <Link className="text-link" to={buildPath(lang, "contact")}>
                  {isArabic ? "تواصل معنا للشراكة" : "Contact for partnership"}
                </Link>
              </div>
            </article>

            <aside className="surface-card detail-side">
              <h3>{isArabic ? "بيانات أساسية" : "Key Data"}</h3>
              <ul className="detail-list">
                <li>
                  <strong>{isArabic ? "الحالة:" : "Status:"}</strong> {project.status}
                </li>
                <li>
                  <strong>{isArabic ? "الميزانية:" : "Budget:"}</strong> {project.budget}
                </li>
                <li>
                  <strong>{isArabic ? "المستفيدون:" : "Beneficiaries:"}</strong>{" "}
                  {project.beneficiaries}
                </li>
                <li>
                  <strong>{isArabic ? "مجال التنفيذ:" : "Implementation Area:"}</strong>{" "}
                  {project.implementationArea}
                </li>
                <li>
                  <strong>{isArabic ? "الجدولة الزمنية:" : "Timeline:"}</strong> {project.timeline}
                </li>
                <li>
                  <strong>{isArabic ? "الشركاء:" : "Partners:"}</strong>{" "}
                  {project.partners?.join(" - ")}
                </li>
              </ul>
            </aside>
          </div>
        ) : (
          <div className="container">{!error ? <p>{content.common.loading}</p> : null}</div>
        )}
      </section>
    </>
  );
}
