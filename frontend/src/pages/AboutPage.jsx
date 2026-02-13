import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { buildPath } from "../i18n/content";

export default function AboutPage() {
  const { lang } = useOutletContext();

  const isArabic = lang !== "en";
  const title = isArabic ? "من نحن | مؤسسة غسات الكبرى" : "About Us | Ghassate Organization";
  const description = isArabic
    ? "تعرف على رسالة مؤسسة غسات الكبرى، نموذج الحوكمة، وآلية تنفيذ المشاريع التنموية والثقافية."
    : "Learn about Ghassate Organization's mission, governance model, and delivery framework.";

  const pillars = isArabic
    ? [
        {
          title: "رسالتنا",
          text: "تحويل المبادرات المحلية إلى برامج مؤسسية واضحة الأهداف، قابلة للقياس، وقابلة للتوسيع."
        },
        {
          title: "رؤيتنا",
          text: "بناء مؤسسة مرجعية في التنمية المحلية تجمع بين الهوية الثقافية والنجاعة التنفيذية."
        },
        {
          title: "نموذج الحوكمة",
          text: "اعتماد الشفافية، مؤشرات الأداء، والتقارير الدورية لصناعة ثقة طويلة المدى."
        }
      ]
    : [
        {
          title: "Our Mission",
          text: "Transform local initiatives into institutional programs with clear goals and measurable outcomes."
        },
        {
          title: "Our Vision",
          text: "Build a leading local-development organization balancing cultural identity and execution quality."
        },
        {
          title: "Governance Model",
          text: "Rely on transparency, KPI tracking, and periodic reporting to sustain long-term trust."
        }
      ];

  const timeline = isArabic
    ? [
        { phase: "التشخيص", text: "تحليل السياق المحلي وتحديد الأولويات المجتمعية." },
        { phase: "التصميم", text: "صياغة برامج عملية بميزانيات ومسؤوليات واضحة." },
        { phase: "التنفيذ", text: "متابعة ميدانية متواصلة وتنسيق مع الشركاء." },
        { phase: "التقييم", text: "قياس النتائج ونشر التقارير وتحديث الخطط." }
      ]
    : [
        { phase: "Diagnosis", text: "Assess local context and identify community priorities." },
        { phase: "Design", text: "Build executable programs with clear budgets and ownership." },
        { phase: "Delivery", text: "Run projects with continuous field monitoring and partner coordination." },
        { phase: "Evaluation", text: "Measure outcomes, publish reports, and refine the roadmap." }
      ];

  const strategicAxes = isArabic
    ? [
        {
          title: "المحور الاجتماعي",
          text: "تصميم برامج إدماج للفئات الهشة ترتبط بالتكوين والتمكين الاقتصادي."
        },
        {
          title: "المحور الاقتصادي",
          text: "مواكبة التعاونيات والمبادرات المحلية للرفع من القيمة المضافة وفرص التسويق."
        },
        {
          title: "المحور الثقافي",
          text: "تحويل الموروث المحلي إلى رافعة للتنمية السياحية والاقتصاد الإبداعي."
        }
      ]
    : [
        {
          title: "Social Axis",
          text: "Design inclusion pathways for vulnerable groups through learning and economic enablement."
        },
        {
          title: "Economic Axis",
          text: "Support cooperatives and local initiatives to improve value creation and market access."
        },
        {
          title: "Cultural Axis",
          text: "Turn local heritage into a driver for tourism development and creative economy."
        }
      ];

  return (
    <>
      <Seo
        lang={lang}
        title={title}
        description={description}
        slug="about"
        schemaType="AboutPage"
        breadcrumbs={[{ name: isArabic ? "من نحن" : "About", slug: "about" }]}
      />

      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: isArabic ? "من نحن" : "About" }]} />
          <div className="section-top">
            <span className="section-tag">{isArabic ? "تعريف المؤسسة" : "Organization Profile"}</span>
            <h1 className="section-title">{isArabic ? "من نحن" : "About Us"}</h1>
            <p className="section-copy">{description}</p>
          </div>
        </div>

        <div className="container cards-grid grid-3">
          {pillars.map((item) => (
            <article className="surface-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-alt">
        <div className="container section-headline-row">
          <div>
            <span className="section-tag">{isArabic ? "سير العمل" : "Workflow"}</span>
            <h2 className="section-title">
              {isArabic ? "كيف نحول الفكرة إلى أثر" : "How ideas become measurable impact"}
            </h2>
          </div>
        </div>
        <div className="container cards-grid grid-2">
          {timeline.map((item) => (
            <article className="surface-card timeline-card" key={item.phase}>
              <span className="meta-chip">{item.phase}</span>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container section-headline-row">
          <div>
            <span className="section-tag">{isArabic ? "محاور التدخل" : "Intervention Axes"}</span>
            <h2 className="section-title">
              {isArabic ? "البرامج وفق أولويات واقعية" : "Programs structured around practical priorities"}
            </h2>
          </div>
        </div>
        <div className="container cards-grid grid-3">
          {strategicAxes.map((axis) => (
            <article className="surface-card" key={axis.title}>
              <h3>{axis.title}</h3>
              <p>{axis.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container cta-banner">
          <div>
            <h2>{isArabic ? "هل ترغب في شراكة مباشرة؟" : "Interested in a direct partnership?"}</h2>
            <p>
              {isArabic
                ? "نرحب بالهيئات الداعمة، المؤسسات التعليمية، والقطاع الخاص ضمن برامج واضحة المعالم."
                : "We welcome supporting entities, educational institutions, and private-sector partners."}
            </p>
          </div>
          <Link className="btn btn-primary" to={buildPath(lang, "contact")}>
            {isArabic ? "تواصل معنا" : "Contact Us"}
          </Link>
        </div>
      </section>
    </>
  );
}
