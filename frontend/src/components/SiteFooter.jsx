import React from "react";
import { Link } from "react-router-dom";
import { buildPath } from "../i18n/content";

function SocialIcon({ type }) {
  if (type === "facebook") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.6 1.7-1.6h1.5V4.8c-.3 0-1.2-.1-2.4-.1-2.4 0-4 1.5-4 4.3V11H8v3h2.3v8h3.2z" />
      </svg>
    );
  }

  if (type === "instagram") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 7a5 5 0 100 10 5 5 0 000-10zm0 8.2a3.2 3.2 0 110-6.4 3.2 3.2 0 010 6.4zM18.5 6.8a1.2 1.2 0 11-2.4 0 1.2 1.2 0 012.4 0z" />
        <path d="M12 3.8c2.7 0 3 0 4.1.1 1 .1 1.5.2 1.8.4.4.2.7.4 1 .7.3.3.5.6.7 1 .2.3.3.8.4 1.8.1 1.1.1 1.4.1 4.1s0 3-.1 4.1c-.1 1-.2 1.5-.4 1.8-.2.4-.4.7-.7 1-.3.3-.6.5-1 .7-.3.2-.8.3-1.8.4-1.1.1-1.4.1-4.1.1s-3 0-4.1-.1c-1-.1-1.5-.2-1.8-.4-.4-.2-.7-.4-1-.7-.3-.3-.5-.6-.7-1-.2-.3-.3-.8-.4-1.8-.1-1.1-.1-1.4-.1-4.1s0-3 .1-4.1c.1-1 .2-1.5.4-1.8.2-.4.4-.7.7-1 .3-.3.6-.5 1-.7.3-.2.8-.3 1.8-.4 1.1-.1 1.4-.1 4.1-.1M12 2c-2.8 0-3.2 0-4.2.1-1.1.1-1.9.3-2.5.6-.6.3-1.2.7-1.7 1.2S2.7 4.9 2.4 5.5c-.3.6-.5 1.4-.6 2.5C1.7 9 1.7 9.4 1.7 12s0 3 .1 4.2c.1 1.1.3 1.9.6 2.5.3.6.7 1.2 1.2 1.7s1.1.9 1.7 1.2c.6.3 1.4.5 2.5.6 1.2.1 1.4.1 4.2.1s3 0 4.2-.1c1.1-.1 1.9-.3 2.5-.6.6-.3 1.2-.7 1.7-1.2s.9-1.1 1.2-1.7c.3-.6.5-1.4.6-2.5.1-1.2.1-1.4.1-4.2s0-3-.1-4.2c-.1-1.1-.3-1.9-.6-2.5-.3-.6-.7-1.2-1.2-1.7s-1.1-.9-1.7-1.2c-.6-.3-1.4-.5-2.5-.6C15 2 14.8 2 12 2z" />
      </svg>
    );
  }

  if (type === "linkedin") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.2 8.7a1.9 1.9 0 110-3.8 1.9 1.9 0 010 3.8zM4.6 9.9h3.2V20H4.6zM10 9.9h3v1.4h.1c.4-.8 1.5-1.7 3-1.7 3.3 0 3.9 2.2 3.9 5V20h-3.2v-4.7c0-1.1 0-2.6-1.6-2.6s-1.8 1.2-1.8 2.5V20H10z" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21.8 7s-.2-1.4-.8-2.1c-.8-.9-1.6-.9-2-.9C16.1 3.8 12 3.8 12 3.8h0s-4.1 0-7 .2c-.4 0-1.2 0-2 .9C2.4 5.6 2.2 7 2.2 7S2 8.7 2 10.3v1.5C2 13.3 2.2 15 2.2 15s.2 1.4.8 2.1c.8.9 1.9.9 2.4 1 1.8.2 6.6.2 6.6.2s4.1 0 7-.2c.4 0 1.2 0 2-.9.6-.7.8-2.1.8-2.1s.2-1.7.2-3.2v-1.5C22 8.7 21.8 7 21.8 7zM9.8 14.1V8.8l5.1 2.7-5.1 2.6z" />
    </svg>
  );
}

export default function SiteFooter({ lang, content, siteSettings }) {
  const contactEmail = siteSettings?.contact?.email || "contact@ghassate.org";
  const contactPhone = siteSettings?.contact?.phone || "+212 6 00 00 00 00";
  const address = siteSettings?.contact?.address || content.footer.address;
  const donationBeneficiary = siteSettings?.donation?.beneficiary || "Ghassate Organization";
  const socialLinks = [
    { label: "Facebook", href: siteSettings?.social?.facebook, icon: "facebook" },
    { label: "Instagram", href: siteSettings?.social?.instagram, icon: "instagram" },
    { label: "LinkedIn", href: siteSettings?.social?.linkedin, icon: "linkedin" },
    { label: "YouTube", href: siteSettings?.social?.youtube, icon: "youtube" }
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div className="footer-brand">
          <h3>{content.siteName}</h3>
          <p className="footer-amazigh-name">{content.siteNameAmazigh}</p>
          <p>{content.footer.about}</p>
          <p className="footer-governance-note">{content.footer.governance}</p>
          <div className="footer-contact-list">
            <a href={`mailto:${contactEmail}`}>{contactEmail}</a>
            <a href={`tel:${contactPhone.replace(/\s+/g, "")}`}>{contactPhone}</a>
          </div>
          <div className="footer-address">
            <h5>{content.footer.addressTitle}</h5>
            <p>{address}</p>
            <p>{donationBeneficiary}</p>
          </div>
        </div>

        <div>
          <h4>{content.footer.quickLinks}</h4>
          <div className="footer-links">
            <Link to={buildPath(lang)}>{content.nav.home}</Link>
            <Link to={buildPath(lang, "about")}>{content.nav.about}</Link>
            <Link to={buildPath(lang, "team")}>{content.nav.team}</Link>
            <Link to={buildPath(lang, "projects")}>{content.nav.projects}</Link>
            <Link to={buildPath(lang, "news")}>{content.nav.news}</Link>
          </div>
        </div>

        <div>
          <h4>{content.footer.governanceLinks}</h4>
          <div className="footer-links">
            <Link to={buildPath(lang, "integrity-charter")}>{content.nav.integrity}</Link>
            <Link to={buildPath(lang, "privacy-policy")}>{content.nav.privacy}</Link>
            <Link to={buildPath(lang, "team")}>{content.nav.team}</Link>
            <a href="/sitemap.xml" target="_blank" rel="noreferrer">
              Sitemap.xml
            </a>
            <a href="/robots.txt" target="_blank" rel="noreferrer">
              Robots.txt
            </a>
          </div>
        </div>

        <div>
          <h4>{content.footer.support}</h4>
          <div className="footer-links">
            <Link to={buildPath(lang, "donate")}>{content.nav.donate}</Link>
            <Link to={buildPath(lang, "membership")}>{content.nav.membership}</Link>
            <Link to={buildPath(lang, "contact")}>{content.nav.contact}</Link>
          </div>

          <h4 className="footer-social-title">{content.footer.social}</h4>
          <div className="footer-social">
            {socialLinks.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer">
                <span className="social-icon">
                  <SocialIcon type={item.icon} />
                </span>
                {item.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="container footer-copy">
        <span>© {new Date().getFullYear()} Ghassate Organization</span>
        <span>{content.footer.rights}</span>
      </div>
    </footer>
  );
}
