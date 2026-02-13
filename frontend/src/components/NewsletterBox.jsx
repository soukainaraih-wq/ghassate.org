import React, { useState } from "react";
import { subscribeNewsletter } from "../lib/api";

const copy = {
  ar: {
    title: "اشترك في النشرة البريدية",
    subtitle: "نشرة المؤسسة",
    description: "استقبل أخبار المشاريع والتقارير الدورية وفرص التطوع.",
    placeholder: "أدخل بريدك الإلكتروني",
    success: "تم الاشتراك بنجاح. سنرسل لك آخر التحديثات.",
    error: "تعذر تنفيذ الاشتراك، حاول مرة أخرى.",
    aria: "اشتراك في النشرة"
  },
  zgh: {
    title: "Jjujjed deg unebdu n imayl",
    subtitle: "Anebddu n tsudest",
    description: "Ssekcem inghmisen n isenfar d isallen n uḍfar d iferdisen n tawuri.",
    placeholder: "Sekcem imayl inek",
    success: "Yella umuqqel n ummuden. Ad ak-d nazen imaynuten.",
    error: "Ur yessaweḍ ara ummuden, eɛred tikkelt nniḍen.",
    aria: "Ammuden n unebdu"
  },
  en: {
    title: "Subscribe to the newsletter",
    subtitle: "Organization Newsletter",
    description: "Receive project updates, periodic reports, and volunteering opportunities.",
    placeholder: "Enter your email",
    success: "Subscription completed successfully. You will receive our latest updates.",
    error: "Subscription failed, please try again.",
    aria: "Newsletter signup"
  }
};

export default function NewsletterBox({ lang, content }) {
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [formStartedAt, setFormStartedAt] = useState(() => Date.now());
  const [state, setState] = useState({ status: "idle", message: "" });
  const t = copy[lang] || copy.ar;

  async function onSubmit(event) {
    event.preventDefault();
    setState({ status: "loading", message: "" });

    try {
      await subscribeNewsletter({ email, lang, company, formStartedAt });
      setState({
        status: "success",
        message: t.success
      });
      setEmail("");
      setCompany("");
      setFormStartedAt(Date.now());
    } catch (error) {
      setState({
        status: "error",
        message: t.error
      });
    }
  }

  return (
    <section className="newsletter-box">
      <div className="newsletter-copy">
        <span className="section-tag">{t.subtitle}</span>
        <h3>{t.title}</h3>
        <p>{t.description}</p>
      </div>

      <form onSubmit={onSubmit} aria-label={t.aria}>
        <div className="honeypot-field" aria-hidden="true">
          <label htmlFor="newsletter-company">Company</label>
          <input
            id="newsletter-company"
            name="company"
            value={company}
            onChange={(event) => setCompany(event.target.value)}
            tabIndex={-1}
            autoComplete="off"
          />
        </div>

        <input
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t.placeholder}
          required
        />
        <input type="hidden" value={formStartedAt} readOnly />
        <button type="submit" disabled={state.status === "loading"}>
          {state.status === "loading" ? content.common.loading : content.common.subscribe}
        </button>
      </form>

      {state.message ? (
        <p className={`form-message ${state.status}`} role="status" aria-live="polite">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}
