import React from "react";
import { Link, useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { buildPath } from "../i18n/content";

export default function PrivacyPage() {
  const { lang, content } = useOutletContext();

  const copy = {
    ar: {
      title: "سياسة الخصوصية | مؤسسة غسات الكبرى",
      description:
        "تعرف على سياسة الخصوصية وملفات تعريف الارتباط وآليات حماية البيانات في منصة مؤسسة غسات الكبرى.",
      sectionTag: "الخصوصية وحماية البيانات",
      heading: "سياسة الخصوصية",
      intro:
        "تلتزم مؤسسة غسات الكبرى بحماية بيانات زوار المنصة، وتوضح هذه الصفحة ما يتم جمعه، سبب جمعه، وكيفية التحكم فيه.",
      sections: [
        {
          title: "1) البيانات التي قد نجمعها",
          body: "بيانات التواصل التي تدخلها بشكل مباشر مثل الاسم والبريد الإلكتروني ورقم الهاتف، إضافة إلى بيانات تقنية أساسية مثل نوع المتصفح واللغة المفضلة."
        },
        {
          title: "2) ملفات تعريف الارتباط (Cookies)",
          body: "نستخدم ملفات أساسية لضمان عمل الموقع، ويمكن تفعيل ملفات تحليل الأداء فقط بعد موافقتك. يمكنك تغيير قرارك لاحقًا بحذف بيانات المتصفح."
        },
        {
          title: "3) الغرض من المعالجة",
          body: "تحسين جودة الخدمة، الرد على الرسائل، إدارة طلبات الانخراط، وتحليل أداء المحتوى بشكل عام دون بيع البيانات لأطراف ثالثة."
        },
        {
          title: "4) حفظ البيانات",
          body: "نحتفظ بالبيانات للفترة اللازمة فقط لأغراض المتابعة المؤسسية، ثم تتم أرشفتها أو حذفها حسب الحاجة والالتزامات القانونية."
        },
        {
          title: "5) حقوقك",
          body: "يمكنك طلب تصحيح أو حذف بياناتك أو الاستفسار عن طريقة استخدامها عبر التواصل معنا مباشرة."
        }
      ],
      supportTitle: "الاستفسارات المتعلقة بالخصوصية",
      supportText:
        "لأي استفسار بخصوص البيانات أو ملفات تعريف الارتباط، يمكنك مراسلتنا عبر صفحة الاتصال الرسمية.",
      supportButton: "التواصل حول الخصوصية"
    },
    zgh: {
      title: "Tasertit n tba3diyt | Tasudest n Ghassate",
      description:
        "Issin ɣef tasertit n tba3diyt, cookies, d umeknas n usellak n yisefka deg usmel n Tsudest n Ghassate.",
      sectionTag: "Tba3diyt d usellak n yisefka",
      heading: "Tasertit n tba3diyt",
      intro:
        "Tasudest n Ghassate tettzammam s usellak n yisefka n yennar. Asebter-a isken ayen yettwajmaɛen, acimi, d amek i t-id tsenqed.",
      sections: [
        {
          title: "1) Issefka i nezmer ad neǧmeɛ",
          body: "Issefka n unermes am yisem, imayl, uṭṭun n tilifun, d kra n isallen itikniken am anaw n browser d tutlayt."
        },
        {
          title: "2) Cookies",
          body: "Nseqdac cookies i ilaqen i usefti n usmel. Cookies n usleḍ ur ttwarmaden ara alamma tzemreḍ s umewafaq."
        },
        {
          title: "3) Iɣerḍan n useqdec",
          body: "Aseggem n tquality n umeẓlu, tiririt i yisefka n unermes, asefrak n usuter n unekcum, d usleḍ amatu n umeslay."
        },
        {
          title: "4) Aḥraz n yisefka",
          body: "Nettaḥraz isefka kan i wakud ilaqen i uḍfar anaddan. S yin ad ttwarsen neɣ ad ttwkksen ilmend n lḥaja."
        },
        {
          title: "5) Izrefan inek",
          body: "Tzemreḍ ad tessutreḍ aseggem neɣ tukksa n yisefka nnek s unermes aɣ-d srid."
        }
      ],
      supportTitle: "Isteqsiyen ɣef tba3diyt",
      supportText: "I wakud n yisteqsiyen ɣef yisefka neɣ cookies, nermes-a-d s usebter unṣib n unermes.",
      supportButton: "Nermes-a ɣef tba3diyt"
    },
    en: {
      title: "Privacy Policy | Ghassate Organization",
      description:
        "Review our privacy and cookie policy, including how personal data is collected, processed, and protected.",
      sectionTag: "Privacy and Data Protection",
      heading: "Privacy Policy",
      intro:
        "Ghassate Organization is committed to protecting visitor data. This page explains what we collect, why we collect it, and how you can control it.",
      sections: [
        {
          title: "1) Data we may collect",
          body: "Directly submitted contact data such as name, email, and phone number, along with basic technical metadata like browser type and preferred language."
        },
        {
          title: "2) Cookies",
          body: "Essential cookies are used to keep the website functional. Analytics cookies are activated only after your consent and can be revoked by clearing browser data."
        },
        {
          title: "3) Purpose of processing",
          body: "To improve service quality, respond to inquiries, manage membership requests, and evaluate overall content performance. We do not sell personal data."
        },
        {
          title: "4) Data retention",
          body: "Data is retained only for the period required for operational follow-up, then archived or deleted based on legal and institutional needs."
        },
        {
          title: "5) Your rights",
          body: "You may request correction or deletion of your data and ask how it is being processed at any time."
        }
      ],
      supportTitle: "Privacy Inquiries",
      supportText:
        "For any privacy or cookie-related request, please use our official contact channel.",
      supportButton: "Contact for Privacy"
    }
  };

  const t = copy[lang] || copy.ar;

  return (
    <>
      <Seo
        lang={lang}
        title={t.title}
        description={t.description}
        slug="privacy-policy"
        schemaType="WebPage"
        breadcrumbs={[{ name: content.nav.privacy, slug: "privacy-policy" }]}
      />

      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: content.nav.privacy }]} />
          <div className="section-top">
            <span className="section-tag">{t.sectionTag}</span>
            <h1 className="section-title">{t.heading}</h1>
            <p className="section-copy">{t.intro}</p>
          </div>
        </div>

        <div className="container cards-grid grid-2">
          {t.sections.map((item) => (
            <article className="surface-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container cta-banner">
          <div>
            <h2>{t.supportTitle}</h2>
            <p>{t.supportText}</p>
          </div>
          <Link className="btn btn-primary" to={buildPath(lang, "contact")}>
            {t.supportButton}
          </Link>
        </div>
      </section>
    </>
  );
}
