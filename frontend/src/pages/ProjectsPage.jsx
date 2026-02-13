import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { buildPath } from "../i18n/content";
import { getProjects } from "../lib/api";

export default function ProjectsPage() {
  const { lang, content } = useOutletContext();
  const isArabic = lang !== "en";
  const [projects, setProjects] = useState([]);
  const [activeCategory, setActiveCategory] = useState("all");
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    getProjects(lang)
      .then((response) => {
        if (mounted) {
          setProjects(response.items);
          setError("");
        }
      })
      .catch(() => {
        if (mounted) {
          setError(
            isArabic
              ? "تعذر تحميل المشاريع حاليًا، يرجى المحاولة لاحقًا."
              : "Projects cannot be loaded right now. Please try again later."
          );
        }
      });

    return () => {
      mounted = false;
    };
  }, [isArabic, lang]);

  const categories = useMemo(() => {
    const distinct = Array.from(new Set(projects.map((project) => project.category)));
    return ["all", ...distinct];
  }, [projects]);

  const filteredProjects =
    activeCategory === "all"
      ? projects
      : projects.filter((project) => project.category === activeCategory);

  const title = isArabic ? "المشاريع | مؤسسة غسات الكبرى" : "Projects | Ghassate Organization";
  const description = isArabic
    ? "استعرض برامج ومشاريع مؤسسة غسات الكبرى مع مؤشرات التنفيذ والميزانية والفئات المستفيدة."
    : "Explore Ghassate projects with execution status, budget, and beneficiary metrics.";

  return (
    <>
      <Seo
        lang={lang}
        title={title}
        description={description}
        slug="projects"
        schemaType="CollectionPage"
        breadcrumbs={[{ name: isArabic ? "المشاريع" : "Projects", slug: "projects" }]}
      />
      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: isArabic ? "المشاريع" : "Projects" }]} />
          <div className="section-top">
            <span className="section-tag">{isArabic ? "حافظة البرامج" : "Program Portfolio"}</span>
            <h1 className="section-title">{content.nav.projects}</h1>
            <p className="section-copy">{description}</p>
          </div>
        </div>

        <div className="container">
          <div className="chip-row" role="tablist" aria-label={isArabic ? "تصنيف المشاريع" : "Project filters"}>
            {categories.map((category) => {
              const label =
                category === "all" ? (isArabic ? "الكل" : "All") : category;

              return (
                <button
                  key={category}
                  type="button"
                  className={`chip ${activeCategory === category ? "is-active" : ""}`}
                  onClick={() => setActiveCategory(category)}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="container cards-grid grid-3">
          {error ? <p className="form-message error">{error}</p> : null}

          {!error && projects.length === 0 ? <p>{content.common.loading}</p> : null}

          {filteredProjects.map((project) => (
            <article className="surface-card project-card" key={project.id}>
              <span className="meta-chip">{project.category}</span>
              <h3>
                <Link to={buildPath(lang, `projects/${project.slug}`)}>{project.title}</Link>
              </h3>
              <p>{project.excerpt}</p>
              <ul className="project-list">
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
                  <strong>{isArabic ? "مجال التنفيذ:" : "Implementation area:"}</strong>{" "}
                  {project.implementationArea}
                </li>
                <li>
                  <strong>{isArabic ? "الجدولة:" : "Timeline:"}</strong> {project.timeline}
                </li>
              </ul>
              <div className="project-meta">
                <span>{project.status}</span>
                <time dateTime={project.updatedAtIso}>{project.updatedAt}</time>
              </div>
              <Link className="text-link" to={buildPath(lang, `projects/${project.slug}`)}>
                {isArabic ? "تفاصيل المشروع" : "Project details"}
              </Link>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
