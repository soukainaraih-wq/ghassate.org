import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import NewsletterBox from "../components/NewsletterBox";
import Seo from "../components/Seo";
import { buildPath } from "../i18n/content";
import { getImpact, getNews, getProjects } from "../lib/api";

const defaultImpact = {
  ar: [
    { label: "معدل إنجاز البرامج", value: "89%" },
    { label: "تقارير منشورة", value: "14" },
    { label: "شريكًا محليًا", value: "35+" },
    { label: "مستفيد مباشر", value: "4,200" }
  ],
  zgh: [
    { label: "Aswir n usemmed n isenfar", value: "89%" },
    { label: "Imagraden i d-neffeɣ", value: "14" },
    { label: "Imendaden n tmurt", value: "35+" },
    { label: "Infaɛen srid", value: "4,200" }
  ],
  en: [
    { label: "Program completion rate", value: "89%" },
    { label: "Published reports", value: "14" },
    { label: "Local partners", value: "35+" },
    { label: "Direct beneficiaries", value: "4,200" }
  ]
};

const homeCopy = {
  ar: {
    heroTitle: "مؤسسة غسات الكبرى: تنمية محلية بمعايير مؤسسية واضحة",
    heroText:
      "نقدّم مشاريع قابلة للقياس، حوكمة معلنة، وتقارير دورية موثقة. الهدف ليس عرض الأنشطة فقط، بل بناء ثقة حقيقية مع المجتمع والشركاء.",
    heroBadge: "اللغة العربية هي الواجهة الرسمية",
    heroPanelTitle: "مؤشرات الأداء اللحظية",
    heroPanelText:
      "البيانات التالية تُراجع دوريًا وتُستخدم لتوجيه القرارات التنفيذية والمالية داخل المؤسسة.",
    exploreProjects: "استعرض المشاريع",
    aboutMission: "تعرف على المؤسسة",
    trustList: ["مسار حوكمة واضح", "نشر دوري للنتائج", "لغة تواصل مؤسسية"],
    governanceTag: "الحوكمة",
    governanceTitle: "مؤسسة يمكن التحقق منها",
    governanceText:
      "يمكن للزائر مراجعة أعضاء المكتب وميثاق النزاهة والشفافية قبل اتخاذ قرار الدعم أو الشراكة.",
    governanceBlocks: [
      {
        title: "أعضاء المكتب",
        text: "تعرف على الفريق المسير، الأدوار، ومسؤوليات اتخاذ القرار.",
        to: "team"
      },
      {
        title: "ميثاق النزاهة والشفافية",
        text: "سياسات تضارب المصالح، الإفصاح، والتبليغ الداخلي منشورة للعموم.",
        to: "integrity-charter"
      },
      {
        title: "التواصل الرسمي",
        text: "قنوات اتصال مباشرة مع المؤسسة للشراكات والاستفسارات المؤسسية.",
        to: "contact"
      }
    ],
    projectsTag: "البرامج التنموية",
    projectsTitle: "مشاريع جاهزة للدعم والتوسع",
    projectsText: "كل مشروع يتضمن حالة التنفيذ، الميزانية، والفئة المستفيدة.",
    allProjects: "عرض كل المشاريع",
    newsTag: "غرفة الأخبار",
    newsTitle: "مستجدات رسمية وتحديثات موثقة",
    newsText: "أخبار مرتبطة بالنتائج الفعلية والتعاونات الميدانية.",
    allNews: "عرض كل الأخبار",
    loading: "جاري تحميل البيانات..."
  },
  zgh: {
    heroTitle: "Tasudest n Ghassate: taneflit tanaddanit s usuddes afessas",
    heroText:
      "Deg usmel-a, ur d asken kan n urmud. Nekkni nssufeɣ isenfar yettwaznan, amur n umqqim, d isallen n ufares s tissas n umnenni.",
    heroBadge: "Ta3rabt d tagejdant, Tamazight d tutlayt tis kraḍ",
    heroPanelTitle: "Isekkilen n ufares deg lawan",
    heroPanelText:
      "Isekkilen-a ttwaleqmen s wakud iwakken ad mmeslayen ɣef usmekti n tmhal d lbudget.",
    exploreProjects: "Wali isenfar",
    aboutMission: "Ssneɣ ɣef tsudest",
    trustList: ["Amur n umqqim ifazen", "Asufeɣ amkan n yisallen", "Ameslay anaddan"],
    governanceTag: "Anfares d umqqim",
    governanceTitle: "Amaḍal anaddan yettwasnen",
    governanceText:
      "Tzemreḍ ad twaliḍ imdanen n lmaktab d umur n nnezaha uqbel ad teddmeḍ asuter n tawsa neɣ aceṭṭaṛ.",
    governanceBlocks: [
      {
        title: "Imdanen n lmaktab",
        text: "Ssneɣ imeslayen n lmasuliyin d amek i ttwagem yisankaren.",
        to: "team"
      },
      {
        title: "Amur n nnezaha",
        text: "Qawanin n tneqḍit n lemṣlaḥa d usufeɣ n yisallen d-yettwasknen i yimdanen.",
        to: "integrity-charter"
      },
      {
        title: "Anermes unṣib",
        text: "Abrid srid i tsudasin d yimdanen i yebɣan aceṭṭaṛ.",
        to: "contact"
      }
    ],
    projectsTag: "Isenfar n tneflit",
    projectsTitle: "Isenfar i yheyyan i tawsa d usemɣer",
    projectsText: "Kra n usenfar yesɛa addad n usemmed, lbudget, d infaɛen.",
    allProjects: "Wali akk isenfar",
    newsTag: "Axxam n yinghmisen",
    newsTitle: "Inghmisen unṣiben s usnitek",
    newsText: "Imaynuten qqnen ɣer wayen i d-yettnufen deg umaḍal.",
    allNews: "Wali akk inghmisen",
    loading: "Asali n yisefka..."
  },
  en: {
    heroTitle: "Ghassate Organization: local development with institutional discipline",
    heroText:
      "We publish measurable programs, clear governance commitments, and verified progress updates. This platform is designed to build trust, not just visibility.",
    heroBadge: "Arabic is the primary language of the platform",
    heroPanelTitle: "Live Performance Snapshot",
    heroPanelText:
      "These indicators are reviewed on a regular basis and used to steer operational and financial decisions.",
    exploreProjects: "Explore Projects",
    aboutMission: "About the Organization",
    trustList: ["Clear governance pathway", "Scheduled disclosure", "Institutional communication"],
    governanceTag: "Governance",
    governanceTitle: "A verifiable institutional profile",
    governanceText:
      "Visitors can review the leadership team and the integrity charter before committing to support or partnership.",
    governanceBlocks: [
      {
        title: "Leadership Team",
        text: "Review board members, key roles, and decision-making responsibilities.",
        to: "team"
      },
      {
        title: "Integrity Charter",
        text: "Conflict-of-interest controls, disclosure policy, and reporting channels are publicly documented.",
        to: "integrity-charter"
      },
      {
        title: "Official Contact",
        text: "Direct communication channels for institutions, partners, and supporters.",
        to: "contact"
      }
    ],
    projectsTag: "Development Programs",
    projectsTitle: "Programs built for support and scale",
    projectsText: "Each project includes implementation status, budget, and beneficiary profile.",
    allProjects: "View all projects",
    newsTag: "Newsroom",
    newsTitle: "Official updates with verifiable context",
    newsText: "News items are tied to delivery milestones and field-level partnerships.",
    allNews: "View all news",
    loading: "Loading data..."
  }
};

export default function HomePage() {
  const { lang, content, siteSettings } = useOutletContext();
  const [projects, setProjects] = useState([]);
  const [news, setNews] = useState([]);
  const [impact, setImpact] = useState(defaultImpact[lang] || defaultImpact.ar);
  const [loading, setLoading] = useState(true);
  const page = homeCopy[lang] || homeCopy.ar;
  const heroTitle = siteSettings?.hero?.title || page.heroTitle;
  const heroText = siteSettings?.hero?.text || page.heroText;
  const heroBadge = siteSettings?.hero?.badge || page.heroBadge;

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [projectsRes, newsRes, impactRes] = await Promise.all([
          getProjects(lang),
          getNews(lang),
          getImpact(lang)
        ]);

        if (!mounted) {
          return;
        }

        setProjects(projectsRes.items.slice(0, 3));
        setNews(newsRes.items.slice(0, 3));
        setImpact(impactRes.items);
      } catch (error) {
        if (!mounted) {
          return;
        }
        setImpact(defaultImpact[lang] || defaultImpact.ar);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [lang]);

  const trustSummary = useMemo(
    () =>
      page.trustList.map((item) => (
        <li key={item}>
          <span aria-hidden="true">●</span>
          {item}
        </li>
      )),
    [page.trustList]
  );

  return (
    <>
      <Seo
        lang={lang}
        title={content.seo.homeTitle}
        description={content.seo.homeDescription}
        slug=""
        schemaType="CollectionPage"
      />

      <section className="hero">
        <div className="hero-orb hero-orb-one" aria-hidden="true" />
        <div className="hero-orb hero-orb-two" aria-hidden="true" />
        <div className="container hero-grid">
          <div className="hero-copy">
            <span className="hero-badge">{heroBadge}</span>
            <h1>{heroTitle}</h1>
            <p>{heroText}</p>
            <div className="hero-actions">
              <Link className="btn btn-primary" to={buildPath(lang, "projects")}>
                {page.exploreProjects}
              </Link>
              <Link className="btn btn-outline-ink" to={buildPath(lang, "membership")}>
                {content.nav.membership}
              </Link>
              <Link className="btn btn-ghost" to={buildPath(lang, "about")}>
                {page.aboutMission}
              </Link>
            </div>
            <ul className="trust-list">{trustSummary}</ul>
          </div>

          <aside className="hero-panel">
            <h2>{page.heroPanelTitle}</h2>
            <p>{page.heroPanelText}</p>
            <div className="stats-grid">
              {impact.map((item) => (
                <article key={`${item.label}-${item.value}`} className="stat-card">
                  <strong>{item.value}</strong>
                  <span>{item.label}</span>
                </article>
              ))}
            </div>
          </aside>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <div className="kpi-grid">
            {impact.map((item) => (
              <article className="kpi-card" key={`kpi-${item.label}`}>
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} />
          <div className="section-top">
            <span className="section-tag">{page.governanceTag}</span>
            <h2 className="section-title">{page.governanceTitle}</h2>
            <p className="section-copy">{page.governanceText}</p>
          </div>
        </div>

        <div className="container cards-grid grid-3">
          {page.governanceBlocks.map((item) => (
            <article className="surface-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
              <Link className="text-link" to={buildPath(lang, item.to)}>
                {lang === "en" ? "Open page" : lang === "zgh" ? "Kcem ɣer usebter" : "الدخول إلى الصفحة"}
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container section-headline-row">
          <div>
            <span className="section-tag">{page.projectsTag}</span>
            <h2 className="section-title">{page.projectsTitle}</h2>
            <p className="section-copy">{page.projectsText}</p>
          </div>
          <Link className="text-link" to={buildPath(lang, "projects")}>
            {page.allProjects}
          </Link>
        </div>

        <div className="container cards-grid grid-3">
          {loading ? (
            <p>{page.loading}</p>
          ) : (
            projects.map((project) => (
              <article className="surface-card project-card" key={project.id}>
                <span className="meta-chip">{project.category}</span>
                <h3>
                  <Link to={buildPath(lang, `projects/${project.slug}`)}>{project.title}</Link>
                </h3>
                <p>{project.excerpt}</p>
                <div className="project-meta">
                  <span>{project.status}</span>
                  <time dateTime={project.updatedAtIso}>{project.updatedAt}</time>
                </div>
                <Link className="text-link" to={buildPath(lang, `projects/${project.slug}`)}>
                  {lang === "en" ? "Project details" : lang === "zgh" ? "Talqayt n usenfar" : "تفاصيل المشروع"}
                </Link>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="section">
        <div className="container section-headline-row">
          <div>
            <span className="section-tag">{page.newsTag}</span>
            <h2 className="section-title">{page.newsTitle}</h2>
            <p className="section-copy">{page.newsText}</p>
          </div>
          <Link className="text-link" to={buildPath(lang, "news")}>
            {page.allNews}
          </Link>
        </div>

        <div className="container cards-grid grid-3">
          {loading ? (
            <p>{page.loading}</p>
          ) : (
            news.map((item) => (
              <article className="surface-card news-card" key={item.id}>
                <time dateTime={item.publishedAtIso}>{item.publishedAt}</time>
                <h3>
                  <Link to={buildPath(lang, `news/${item.slug}`)}>{item.title}</Link>
                </h3>
                <p>{item.excerpt}</p>
                <Link className="text-link" to={buildPath(lang, `news/${item.slug}`)}>
                  {lang === "en" ? "News details" : lang === "zgh" ? "Talqayt n unghmis" : "تفاصيل الخبر"}
                </Link>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container">
          <NewsletterBox lang={lang} content={content} />
        </div>
      </section>
    </>
  );
}
