import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { buildPath } from "../i18n/content";

export default function DonatePage() {
  const { lang, siteSettings } = useOutletContext();
  const isArabic = lang !== "en";
  const donationIban = siteSettings?.donation?.iban || "MA00 0000 0000 0000 0000 0000";
  const donationBic = siteSettings?.donation?.bic || "GHASMA00";
  const donationBeneficiary = siteSettings?.donation?.beneficiary || "Ghassate Organization";

  const title = isArabic ? "تبرع | مؤسسة غسات الكبرى" : "Donate | Ghassate Organization";
  const description = isArabic
    ? "ادعم برامج المؤسسة عبر قنوات رسمية وآمنة مع تتبع دوري لأثر مساهمتك."
    : "Support the organization through official and secure channels with periodic impact reporting.";

  const plans = isArabic
    ? [
        {
          title: "تحويل بنكي مباشر",
          text: `المستفيد: ${donationBeneficiary} | IBAN: ${donationIban} - BIC: ${donationBic}`,
          badge: "شفاف"
        },
        {
          title: "رعاية مشاريع محددة",
          text: "تمويل مشروع واحد أو أكثر مع مؤشرات قياس وملف تتبع دوري.",
          badge: "أثر قابل للقياس"
        },
        {
          title: "دعم الشركات والمؤسسات",
          text: "برامج شراكة سنوية مع حضور إعلامي وتقارير موثقة.",
          badge: "شراكة استراتيجية"
        }
      ]
    : [
        {
          title: "Direct Bank Transfer",
          text: `Beneficiary: ${donationBeneficiary} | IBAN: ${donationIban} - BIC: ${donationBic}`,
          badge: "Transparent"
        },
        {
          title: "Project-Specific Sponsorship",
          text: "Fund one or more projects with KPI dashboards and periodic reports.",
          badge: "Measurable Impact"
        },
        {
          title: "Corporate Partnerships",
          text: "Annual partnership plans with documented visibility and reports.",
          badge: "Strategic Program"
        }
      ];

  const guarantees = isArabic
    ? [
        "توثيق كل مساهمة ضمن سجل متابعة داخلي.",
        "تحديثات دورية حول مستوى التنفيذ والأثر.",
        "إمكانية توجيه الدعم لمشروع محدد بطلب رسمي."
      ]
    : [
        "Each contribution is documented in internal tracking records.",
        "Periodic updates are issued on implementation and impact.",
        "Support can be directed to a specific project upon formal request."
      ];

  return (
    <>
      <Seo
        lang={lang}
        title={title}
        description={description}
        slug="donate"
        schemaType="WebPage"
        breadcrumbs={[{ name: isArabic ? "تبرع" : "Donate", slug: "donate" }]}
      />
      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: isArabic ? "تبرع" : "Donate" }]} />
          <div className="section-top">
            <span className="section-tag">{isArabic ? "الدعم المؤسسي" : "Institutional Support"}</span>
            <h1 className="section-title">{isArabic ? "الدعم والتبرع" : "Support and Donation"}</h1>
            <p className="section-copy">{description}</p>
          </div>
        </div>

        <div className="container cards-grid grid-3">
          {plans.map((plan) => (
            <article className="surface-card" key={plan.title}>
              <span className="meta-chip">{plan.badge}</span>
              <h3>{plan.title}</h3>
              <p>{plan.text}</p>
            </article>
          ))}
        </div>

        <div className="container section-tight">
          <article className="surface-card">
            <h3>{isArabic ? "ضمانات الشفافية في الدعم" : "Contribution Transparency Guarantees"}</h3>
            <ul className="project-list">
              {guarantees.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </section>

      <section className="section section-tight">
        <div className="container cta-banner">
          <div>
            <h2>{isArabic ? "هل تريد تنسيق دعم مخصص؟" : "Need a customized contribution plan?"}</h2>
            <p>
              {isArabic
                ? "يمكننا إعداد نموذج تعاون مطابق لأهدافك الاجتماعية أو المؤسسية."
                : "We can prepare a support model aligned with your social or institutional goals."}
            </p>
          </div>
          <Link className="btn btn-primary" to={buildPath(lang, "contact")}>
            {isArabic ? "ابدأ التواصل" : "Start Contact"}
          </Link>
        </div>
      </section>
    </>
  );
}
