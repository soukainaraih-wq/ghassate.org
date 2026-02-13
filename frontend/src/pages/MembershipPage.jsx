import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { sendContact } from "../lib/api";

function createInitialForm() {
  return {
    name: "",
    email: "",
    phone: "",
    interest: "",
    message: "",
    nickname: "",
    formStartedAt: Date.now()
  };
}

export default function MembershipPage() {
  const { lang, content } = useOutletContext();
  const [form, setForm] = useState(() => createInitialForm());
  const [state, setState] = useState({ status: "idle", message: "" });

  const copy = {
    ar: {
      title: "الانخراط | مؤسسة غسات الكبرى",
      description:
        "صفحة الانخراط الرسمية: انضم كمتطوع أو عضو داعم أو شريك مؤسساتي.",
      sectionTag: "بوابة الانخراط",
      heading: "انخرط معنا",
      intro:
        "نرحب بالأفراد والمؤسسات الراغبة في الانخراط ضمن برامج المؤسسة وفق مسارات واضحة: تطوع، دعم، أو شراكة تنفيذية.",
      cards: [
        {
          title: "انخراط فردي",
          text: "مساهمة بالوقت أو الخبرة في التكوين، التأطير، أو دعم الأنشطة الميدانية."
        },
        {
          title: "انخراط مؤسساتي",
          text: "شراكة مع جمعيات، مؤسسات تعليمية، أو هيئات محلية ضمن برامج ذات أثر قابل للقياس."
        },
        {
          title: "انخراط داعم",
          text: "دعم مالي أو لوجستي لمشاريع محددة مع تقارير متابعة دورية."
        }
      ],
      formTitle: "طلب الانخراط",
      labels: {
        name: "الاسم الكامل",
        email: "البريد الإلكتروني",
        phone: "رقم الهاتف",
        interest: "مجال الانخراط",
        message: "نبذة عن مساهمتك المقترحة"
      },
      placeholders: {
        interest: "مثال: تطوع، شراكة، دعم مالي",
        message: "اكتب باختصار كيف ترغب في الانخراط..."
      },
      submit: "إرسال الطلب",
      loading: "جاري الإرسال...",
      success: "تم تسجيل طلب الانخراط بنجاح. سنقوم بالتواصل معك قريبًا.",
      error: "تعذر إرسال الطلب حاليًا. حاول مرة أخرى."
    },
    zgh: {
      title: "Anekcum | Tasudest n Ghassate",
      description: "Asebter unṣib n unekcum: kcem-d s tawuri, tawsa, neɣ aceṭṭaṛ anaddan.",
      sectionTag: "Tawwurt n unekcum",
      heading: "Kcem d ameddukal",
      intro:
        "Nruḥb s yimdanen d tsudasin i yebɣan ad kcemen deg isenfar n tsudest s imeskanen ifazen.",
      cards: [
        {
          title: "Anekcum afardis",
          text: "Tawuri s wakud neɣ tmusni deg usegmi, usuddes, neɣ tawuri n umaḍal."
        },
        {
          title: "Anekcum anaddan",
          text: "Aceṭṭaṛ akked tsudasin neɣ tismussniyin i usekrer n isenfar yettwaznan."
        },
        {
          title: "Anekcum n tawsa",
          text: "Tawsa tamẓlayt neɣ atiknik i isenfar i d-yettwasnen s uḍfar amkan."
        }
      ],
      formTitle: "Asuter n unekcum",
      labels: {
        name: "Isem ummid",
        email: "Imayl",
        phone: "Uṭṭun n tiliɣri",
        interest: "Taɣult n unekcum",
        message: "Aglam amezwaru n umttekki"
      },
      placeholders: {
        interest: "Amedya: tawuri, aceṭṭaṛ, tawsa",
        message: "Aru s ufus amek tebɣiḍ ad tkecmeḍ..."
      },
      submit: "Azen asuter",
      loading: "Asali...",
      success: "Asuter n unekcum yewweḍ. Ad ak-nermes s uqreb.",
      error: "Ur yessaweḍ ara usenker n usuter. Eɛred tikkelt nniḍen."
    },
    en: {
      title: "Membership | Ghassate Organization",
      description:
        "Official membership page: join as a volunteer, supporting member, or institutional partner.",
      sectionTag: "Membership Gateway",
      heading: "Join Us",
      intro:
        "We welcome individuals and institutions interested in joining our programs through structured tracks: volunteering, support, or delivery partnership.",
      cards: [
        {
          title: "Individual Membership",
          text: "Contribute your time or expertise in training, mentoring, or field operations."
        },
        {
          title: "Institutional Membership",
          text: "Collaborate as an association, educational body, or local institution in measurable programs."
        },
        {
          title: "Support Membership",
          text: "Provide financial or logistical backing for specific projects with periodic follow-up reports."
        }
      ],
      formTitle: "Membership Request",
      labels: {
        name: "Full Name",
        email: "Email",
        phone: "Phone Number",
        interest: "Area of Interest",
        message: "Brief summary of your proposed contribution"
      },
      placeholders: {
        interest: "Example: volunteering, partnership, financial support",
        message: "Briefly explain how you would like to contribute..."
      },
      submit: "Submit Request",
      loading: "Submitting...",
      success: "Your membership request has been received. Our team will contact you soon.",
      error: "The request could not be submitted right now. Please try again."
    }
  };

  const t = copy[lang] || copy.ar;

  function onChange(event) {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });

    try {
      await sendContact({
        name: form.name,
        email: form.email,
        subject:
          lang === "ar"
            ? `طلب انخراط - ${form.interest}`
            : lang === "zgh"
              ? `Asuter n unekcum - ${form.interest}`
              : `Membership Request - ${form.interest}`,
        message: `Phone: ${form.phone}\nInterest: ${form.interest}\n\n${form.message}`,
        nickname: form.nickname,
        formStartedAt: form.formStartedAt,
        lang
      });

      setState({ status: "success", message: t.success });
      setForm(createInitialForm());
    } catch (error) {
      setState({ status: "error", message: t.error });
    }
  }

  return (
    <>
      <Seo
        lang={lang}
        title={t.title}
        description={t.description}
        slug="membership"
        schemaType="WebPage"
        breadcrumbs={[{ name: content.nav.membership, slug: "membership" }]}
      />

      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: content.nav.membership }]} />
          <div className="section-top">
            <span className="section-tag">{t.sectionTag}</span>
            <h1 className="section-title">{t.heading}</h1>
            <p className="section-copy">{t.intro}</p>
          </div>
        </div>

        <div className="container cards-grid grid-3">
          {t.cards.map((item) => (
            <article className="surface-card" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section section-tight">
        <div className="container membership-layout">
          <form className="surface-card contact-form" onSubmit={onSubmit}>
            <h3>{t.formTitle}</h3>

            <div className="honeypot-field" aria-hidden="true">
              <label htmlFor="membership-nickname">Nickname</label>
              <input
                id="membership-nickname"
                name="nickname"
                value={form.nickname}
                onChange={onChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <label htmlFor="membership-name">{t.labels.name}</label>
            <input
              id="membership-name"
              name="name"
              value={form.name}
              onChange={onChange}
              required
              minLength={2}
            />

            <label htmlFor="membership-email">{t.labels.email}</label>
            <input
              id="membership-email"
              name="email"
              type="email"
              value={form.email}
              onChange={onChange}
              required
            />

            <label htmlFor="membership-phone">{t.labels.phone}</label>
            <input
              id="membership-phone"
              name="phone"
              value={form.phone}
              onChange={onChange}
              required
              minLength={8}
            />

            <label htmlFor="membership-interest">{t.labels.interest}</label>
            <input
              id="membership-interest"
              name="interest"
              value={form.interest}
              onChange={onChange}
              placeholder={t.placeholders.interest}
              required
              minLength={3}
            />

            <label htmlFor="membership-message">{t.labels.message}</label>
            <textarea
              id="membership-message"
              name="message"
              value={form.message}
              onChange={onChange}
              placeholder={t.placeholders.message}
              rows={5}
              required
              minLength={20}
            />

            <button type="submit" className="btn btn-primary" disabled={state.status === "loading"}>
              {state.status === "loading" ? t.loading : t.submit}
            </button>

            {state.message ? (
              <p className={`form-message ${state.status}`} role="status" aria-live="polite">
                {state.message}
              </p>
            ) : null}
          </form>
        </div>
      </section>
    </>
  );
}
