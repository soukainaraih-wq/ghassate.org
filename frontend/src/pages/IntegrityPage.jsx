import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { buildPath } from "../i18n/content";

export default function IntegrityPage() {
  const { lang, content } = useOutletContext();
  const isArabic = lang !== "en";

  const title = isArabic
    ? "ميثاق النزاهة والشفافية | مؤسسة غسات الكبرى"
    : "Integrity & Transparency Charter | Ghassate Organization";
  const description = isArabic
    ? "وثيقة مرجعية تحدد مبادئ النزاهة، قواعد تضارب المصالح، وآليات الإفصاح والتبليغ."
    : "Reference document outlining integrity principles, conflict-of-interest rules, and disclosure mechanisms.";

  const principles = isArabic
    ? [
        {
          title: "الشفافية في المعلومة",
          text: "نلتزم بنشر المعطيات الأساسية للمشاريع: الأهداف، الميزانية، مراحل التنفيذ، ونسب الإنجاز."
        },
        {
          title: "منع تضارب المصالح",
          text: "يلتزم أعضاء المكتب بالتصريح المسبق بأي وضعية تضارب محتملة والامتناع عن التصويت عند الاقتضاء."
        },
        {
          title: "المساءلة والتتبع",
          text: "تتم مراجعة البرامج دوريًا من خلال مؤشرات أداء واضحة وتقارير متابعة داخلية."
        },
        {
          title: "النزاهة المالية",
          text: "تخضع العمليات المالية لمراقبة داخلية وتوثيق محاسباتي منتظم مع حفظ الوثائق المرجعية."
        },
        {
          title: "قناة التبليغ",
          text: "تتوفر المؤسسة على قناة تواصل مخصصة للتبليغ عن أي ممارسات غير مطابقة: integrity@ghassate.org."
        },
        {
          title: "سياسة المشتريات",
          text: "تعتمد المؤسسة معايير اختيار واضحة للموردين قائمة على الكفاءة، الجودة، والتكلفة العادلة."
        }
      ]
    : [
        {
          title: "Information Transparency",
          text: "We publish core project data including objectives, budgets, delivery milestones, and completion rates."
        },
        {
          title: "Conflict-of-Interest Controls",
          text: "Board members must disclose potential conflicts and recuse themselves from related decisions."
        },
        {
          title: "Accountability and Oversight",
          text: "Programs are reviewed through clear KPIs and periodic internal monitoring reports."
        },
        {
          title: "Financial Integrity",
          text: "Financial operations are subject to internal controls and consistent accounting documentation."
        },
        {
          title: "Reporting Channel",
          text: "A dedicated reporting channel is available for concerns: integrity@ghassate.org."
        },
        {
          title: "Procurement Policy",
          text: "Supplier selection is based on transparent criteria: competence, quality, and fair cost."
        }
      ];

  const disclosures = isArabic
    ? [
        "تقرير الأثر نصف السنوي",
        "بيان الشراكات والتمويل",
        "ملخص التدقيق الداخلي السنوي"
      ]
    : [
        "Semi-annual impact brief",
        "Partnership and funding disclosure note",
        "Annual internal audit summary"
      ];

  return (
    <>
      <Seo
        lang={lang}
        title={title}
        description={description}
        slug="integrity-charter"
        schemaType="WebPage"
        breadcrumbs={[{ name: content.nav.integrity, slug: "integrity-charter" }]}
        modifiedTime="2026-02-10"
      />

      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: content.nav.integrity }]} />
          <div className="section-top">
            <span className="section-tag">{isArabic ? "وثيقة حوكمة" : "Governance Document"}</span>
            <h1 className="section-title">{content.nav.integrity}</h1>
            <p className="section-copy">{description}</p>
          </div>
        </div>

        <div className="container cards-grid grid-3">
          {principles.map((item) => (
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
            <span className="section-tag">{isArabic ? "الإفصاح الدوري" : "Disclosure Cycle"}</span>
            <h2 className="section-title">
              {isArabic ? "الوثائق التي يتم نشرها بانتظام" : "Documents published on a recurring basis"}
            </h2>
          </div>
        </div>
        <div className="container cards-grid grid-3">
          {disclosures.map((item) => (
            <article className="surface-card" key={item}>
              <h3>{item}</h3>
              <p>
                {isArabic
                  ? "يتم نشر هذه الوثيقة وفق جدول زمني داخلي وتوفيرها للجهات الشريكة عند الطلب."
                  : "This document follows a defined publishing cycle and is shared with stakeholders on request."}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container cta-banner">
          <div>
            <h2>{isArabic ? "لديك استفسار حول الامتثال أو التمويل؟" : "Need clarification on compliance or funding?"}</h2>
            <p>
              {isArabic
                ? "يمكنك التواصل معنا مباشرة للحصول على التوضيحات الرسمية أو نسخ الوثائق المرجعية."
                : "Contact us directly for official clarifications or documented references."}
            </p>
          </div>
          <Link className="btn btn-primary" to={buildPath(lang, "contact")}>
            {content.nav.contact}
          </Link>
        </div>
      </section>
    </>
  );
}
