import React, { useState } from "react";
import { useOutletContext } from "react-router-dom";
import Breadcrumbs from "../components/Breadcrumbs";
import Seo from "../components/Seo";
import { sendContact } from "../lib/api";

function createInitialState() {
  return {
    name: "",
    email: "",
    subject: "",
    message: "",
    website: "",
    formStartedAt: Date.now()
  };
}

export default function ContactPage() {
  const { lang, content, siteSettings } = useOutletContext();
  const isArabic = lang !== "en";
  const [form, setForm] = useState(() => createInitialState());
  const [state, setState] = useState({ status: "idle", message: "" });

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });

    try {
      await sendContact({ ...form, lang });
      setState({
        status: "success",
        message: isArabic
          ? "تم إرسال رسالتك بنجاح. سنعود إليك قريبًا."
          : "Your message has been sent successfully. We will get back to you soon."
      });
      setForm(createInitialState());
    } catch (error) {
      setState({
        status: "error",
        message: isArabic
          ? "تعذر إرسال الرسالة. تحقق من البيانات وحاول مرة أخرى."
          : "Message could not be sent. Please verify your data and try again."
      });
    }
  }

  const title = isArabic ? "اتصل بنا | مؤسسة غسات الكبرى" : "Contact | Ghassate Organization";
  const description = isArabic
    ? "تواصل معنا بخصوص الشراكات، الدعم، الإعلام، أو الاستفسارات العامة."
    : "Contact us for partnerships, support, media requests, or general inquiries.";

  const contactEmail = siteSettings?.contact?.email || "contact@ghassate.org";
  const contactPhone = siteSettings?.contact?.phone || "+212 6 00 00 00 00";
  const contactAddress = siteSettings?.contact?.address || (isArabic ? "غسات، ورزازات، المغرب" : "Ghassate, Ouarzazate, Morocco");

  const infoCards = isArabic
    ? [
        { title: "البريد الرسمي", text: contactEmail },
        { title: "الهاتف", text: contactPhone },
        { title: "العنوان", text: contactAddress },
        { title: "زمن الاستجابة", text: "عادة خلال 48 ساعة عمل للطلبات الرسمية." },
        { title: "التعاون الإعلامي", text: "لطلب مقابلات أو ملفات صحفية اذكر عبارة: طلب إعلامي في الموضوع." }
      ]
    : [
        { title: "Official Email", text: contactEmail },
        { title: "Phone", text: contactPhone },
        { title: "Address", text: contactAddress },
        { title: "Response Time", text: "Official requests are typically answered within 48 business hours." },
        { title: "Media Collaboration", text: "For interviews or press kits, include: Media Request in the subject." }
      ];

  return (
    <>
      <Seo
        lang={lang}
        title={title}
        description={description}
        slug="contact"
        schemaType="ContactPage"
        breadcrumbs={[{ name: isArabic ? "اتصل بنا" : "Contact", slug: "contact" }]}
      />
      <section className="section">
        <div className="container">
          <Breadcrumbs lang={lang} items={[{ label: isArabic ? "اتصل بنا" : "Contact" }]} />
          <div className="section-top">
            <span className="section-tag">{isArabic ? "قناة تواصل مباشرة" : "Direct Communication"}</span>
            <h1 className="section-title">{content.nav.contact}</h1>
            <p className="section-copy">{description}</p>
          </div>
        </div>

        <div className="container contact-grid">
          <aside className="contact-side">
            {infoCards.map((item) => (
              <article className="surface-card" key={item.title}>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
              </article>
            ))}
          </aside>

          <form className="surface-card contact-form" onSubmit={handleSubmit}>
            <div className="honeypot-field" aria-hidden="true">
              <label htmlFor="website">Website</label>
              <input
                id="website"
                name="website"
                value={form.website}
                onChange={handleChange}
                tabIndex={-1}
                autoComplete="off"
              />
            </div>

            <label htmlFor="name">{isArabic ? "الاسم الكامل" : "Full Name"}</label>
            <input
              id="name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              minLength={2}
            />

            <label htmlFor="email">{isArabic ? "البريد الإلكتروني" : "Email"}</label>
            <input
              id="email"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
            />

            <label htmlFor="subject">{isArabic ? "الموضوع" : "Subject"}</label>
            <input
              id="subject"
              name="subject"
              value={form.subject}
              onChange={handleChange}
              required
              minLength={4}
            />

            <label htmlFor="message">{isArabic ? "الرسالة" : "Message"}</label>
            <textarea
              id="message"
              name="message"
              value={form.message}
              onChange={handleChange}
              required
              minLength={20}
              rows={6}
            />

            <button type="submit" className="btn btn-primary" disabled={state.status === "loading"}>
              {state.status === "loading" ? content.common.loading : content.common.send}
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
