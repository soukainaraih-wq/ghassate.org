import React, { useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { SITE_ORIGIN, buildPath } from "../i18n/content";

export default function TeamPage() {
  const { lang, content } = useOutletContext();
  const isArabic = lang !== "en";

  const pageTitle = isArabic
    ? "أعضاء المكتب | مؤسسة غسات الكبرى"
    : "Leadership Team | Ghassate Organization";
  const pageDescription = isArabic
    ? "تعرف على أعضاء المكتب المسير، مهامهم، ومسؤولياتهم في تنفيذ برامج المؤسسة."
    : "Meet the leadership team, their responsibilities, and governance roles in program delivery.";

  const leadership = isArabic
    ? [
        {
          name: "فاطمة الزهراء بنعلي",
          role: "الرئيسة",
          focus: "الاستراتيجية والشراكات المؤسسية",
          bio: "تقود التوجه العام للمؤسسة وتنسق اتفاقيات التعاون مع الفاعلين المحليين والوطنيين."
        },
        {
          name: "إدريس أزركان",
          role: "نائب الرئيس",
          focus: "التتبع والتقييم",
          bio: "يشرف على متابعة مؤشرات الأداء وقياس الأثر الدوري للمشاريع."
        },
        {
          name: "سمية العمراني",
          role: "الكاتبة العامة",
          focus: "الحوكمة والامتثال",
          bio: "تؤمن التوثيق الإداري، محاضر الاجتماعات، والالتزام بالمساطر الداخلية."
        },
        {
          name: "عبد الرحيم أكلي",
          role: "أمين المال",
          focus: "الرقابة المالية",
          bio: "يتابع الميزانية، تدفقات الدعم، وإعداد البيانات المالية الدورية."
        },
        {
          name: "نادية الهبطي",
          role: "مستشارة البرامج",
          focus: "تمكين الشباب والنساء",
          bio: "تساهم في تصميم البرامج الاجتماعية وربطها باحتياجات الفئات المستهدفة."
        },
        {
          name: "يوسف المحمدي",
          role: "مستشار التواصل",
          focus: "التواصل المؤسسي",
          bio: "يشرف على الرسائل الإعلامية الرسمية ونشر الأخبار والتقارير."
        }
      ]
    : [
        {
          name: "Fatima Ezzahra Bennali",
          role: "President",
          focus: "Strategy and Institutional Partnerships",
          bio: "Leads the overall direction of the organization and oversees strategic partnership agreements."
        },
        {
          name: "Idriss Azarkan",
          role: "Vice President",
          focus: "Monitoring and Evaluation",
          bio: "Supervises KPI tracking and periodic impact measurement across programs."
        },
        {
          name: "Soumia El Omrani",
          role: "General Secretary",
          focus: "Governance and Compliance",
          bio: "Ensures administrative documentation, board minutes, and compliance with internal procedures."
        },
        {
          name: "Abderrahim Akli",
          role: "Treasurer",
          focus: "Financial Oversight",
          bio: "Monitors budgets, contribution flows, and periodic financial reporting."
        },
        {
          name: "Nadia El Hebti",
          role: "Program Advisor",
          focus: "Youth and Women's Inclusion",
          bio: "Supports program design and aligns interventions with community priorities."
        },
        {
          name: "Youssef El Mohammedi",
          role: "Communications Advisor",
          focus: "Institutional Communication",
          bio: "Manages official messaging, newsroom output, and publication quality."
        }
      ];

  const committees = isArabic
    ? [
        {
          title: "لجنة الحكامة والنزاهة",
          text: "تراجع الالتزام بميثاق النزاهة وتصدر توصيات التحسين."
        },
        {
          title: "لجنة البرامج والمشاريع",
          text: "تصادق على خطط التنفيذ ومؤشرات التتبع لكل مشروع."
        },
        {
          title: "لجنة الشراكات والتعبئة",
          text: "تنسق مع الجهات المانحة والقطاع الخاص لضمان تمويل مستدام."
        }
      ]
    : [
        {
          title: "Governance & Integrity Committee",
          text: "Reviews compliance with the integrity charter and issues improvement recommendations."
        },
        {
          title: "Programs & Projects Committee",
          text: "Validates delivery plans and KPI frameworks for each project."
        },
        {
          title: "Partnerships & Resource Mobilization Committee",
          text: "Coordinates with donors and private-sector partners to secure sustainable funding."
        }
      ];

  const teamSchema = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: isArabic ? "أعضاء المكتب المسير" : "Leadership Team",
      itemListElement: leadership.map((member, index) => ({
        "@type": "Person",
        position: index + 1,
        name: member.name,
        jobTitle: member.role,
        worksFor: {
          "@type": "Organization",
          name: "Ghassate Organization",
          url: SITE_ORIGIN
        }
      }))
    }),
    [isArabic, leadership]
  );

  return (
    <>
      <Seo
        lang={lang}
        title={pageTitle}
        description={pageDescription}
        slug="team"
        schemaType="AboutPage"
        breadcrumbs={[{ name: content.nav.team, slug: "team" }]}
        extraSchemas={[teamSchema]}
      />

      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: content.nav.team }]} />
          <div className="section-top">
            <span className="section-tag">{isArabic ? "الهيكلة التنظيمية" : "Organizational Structure"}</span>
            <h1 className="section-title">{content.nav.team}</h1>
            <p className="section-copy">{pageDescription}</p>
          </div>
        </div>

        <div className="container cards-grid grid-3">
          {leadership.map((member) => (
            <article className="surface-card profile-card" key={member.name}>
              <h3>{member.name}</h3>
              <p className="meta-note">
                <strong>{member.role}</strong> - {member.focus}
              </p>
              <p>{member.bio}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container section-headline-row">
          <div>
            <span className="section-tag">{isArabic ? "اللجان الوظيفية" : "Functional Committees"}</span>
            <h2 className="section-title">
              {isArabic ? "كيف يتم اتخاذ القرار المؤسسي" : "How institutional decisions are made"}
            </h2>
          </div>
        </div>
        <div className="container cards-grid grid-3">
          {committees.map((committee) => (
            <article className="surface-card" key={committee.title}>
              <h3>{committee.title}</h3>
              <p>{committee.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container cta-banner">
          <div>
            <h2>
              {isArabic
                ? "راجع أيضًا ميثاق النزاهة والشفافية"
                : "Review our Integrity and Transparency Charter"}
            </h2>
            <p>
              {isArabic
                ? "الميثاق يوضح قواعد تضارب المصالح، النشر الدوري، وآليات التبليغ الداخلي."
                : "The charter defines conflict-of-interest rules, disclosure cadence, and internal reporting channels."}
            </p>
          </div>
          <Link className="btn btn-primary" to={buildPath(lang, "integrity-charter")}>
            {content.nav.integrity}
          </Link>
        </div>
      </section>
    </>
  );
}
