import React from "react";
import { Helmet } from "react-helmet-async";
import { SITE_ORIGIN, buildPath } from "../i18n/content";

function buildAbsolute(path) {
  if (/^https?:\/\//.test(path)) {
    return path;
  }

  return `${SITE_ORIGIN}${path}`;
}

function buildBreadcrumbSchema(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  };
}

export default function Seo({
  lang,
  title,
  description,
  slug = "",
  noindex = false,
  type = "website",
  schemaType = "WebPage",
  breadcrumbs = [],
  image,
  publishedTime,
  modifiedTime,
  extraSchemas = []
}) {
  const canonicalPath = buildPath(lang, slug);
  const canonicalUrl = buildAbsolute(canonicalPath);
  const arUrl = buildAbsolute(buildPath("ar", slug));
  const zghUrl = buildAbsolute(buildPath("zgh", slug));
  const enUrl = buildAbsolute(buildPath("en", slug));
  const defaultUrl = arUrl;
  const localeMap = {
    ar: "ar_MA",
    zgh: "zgh_MA",
    en: "en_US"
  };
  const ogLocale = localeMap[lang] || "ar_MA";
  const ogImage = image ? buildAbsolute(image) : buildAbsolute("/og-default.png");
  const labels = {
    ar: { home: "الرئيسية", site: "مؤسسة غسات الكبرى" },
    zgh: { home: "Asebter agejdan", site: "Tasudest n Ghassate Tamqqwrant" },
    en: { home: "Home", site: "Ghassate Organization" }
  };
  const t = labels[lang] || labels.ar;

  const breadcrumbItems = [
    {
      name: t.home,
      url: buildAbsolute(buildPath(lang))
    },
    ...breadcrumbs.map((item) => ({
      name: item.name,
      url: buildAbsolute(buildPath(lang, item.slug))
    }))
  ];

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_ORIGIN}#organization`,
    name: "مؤسسة غسات الكبرى",
    alternateName: "Ghassate Organization",
    url: SITE_ORIGIN,
    email: "contact@ghassate.org",
    telephone: "+212600000000",
    logo: buildAbsolute("/favicon.svg"),
    address: {
      "@type": "PostalAddress",
      addressLocality: "Ghassate",
      addressRegion: "Draa-Tafilalet",
      addressCountry: "MA"
    },
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "contact@ghassate.org",
        telephone: "+212600000000",
        availableLanguage: ["Arabic", "English"]
      }
    ],
    sameAs: [
      "https://www.facebook.com/ghassateorg",
      "https://www.instagram.com/ghassateorg",
      "https://www.linkedin.com/company/ghassateorg",
      "https://www.youtube.com/@ghassateorg"
    ]
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_ORIGIN}#website`,
    url: SITE_ORIGIN,
    name: t.site,
    inLanguage: lang
  };

  const pageSchema = {
    "@context": "https://schema.org",
    "@type": schemaType,
    name: title,
    description,
    url: canonicalUrl,
    inLanguage: lang,
    isPartOf: { "@id": `${SITE_ORIGIN}#website` },
    publisher: { "@id": `${SITE_ORIGIN}#organization` }
  };

  if (publishedTime) {
    pageSchema.datePublished = publishedTime;
  }

  if (modifiedTime) {
    pageSchema.dateModified = modifiedTime;
  }

  const schemas = [
    organizationSchema,
    websiteSchema,
    pageSchema,
    ...(breadcrumbs.length > 0 ? [buildBreadcrumbSchema(breadcrumbItems)] : []),
    ...extraSchemas
  ];

  return (
    <Helmet>
      <html lang={lang} dir={lang === "ar" ? "rtl" : "ltr"} />
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={noindex ? "noindex,nofollow" : "index,follow"} />
      <meta name="theme-color" content="#0d3a2a" />

      <link rel="canonical" href={canonicalUrl} />
      <link rel="alternate" hrefLang="ar" href={arUrl} />
      <link rel="alternate" hrefLang="zgh" href={zghUrl} />
      <link rel="alternate" hrefLang="en" href={enUrl} />
      <link rel="alternate" hrefLang="x-default" href={defaultUrl} />

      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content="Ghassate Organization" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content="ar_MA" />
      <meta property="og:locale:alternate" content="zgh_MA" />
      <meta property="og:locale:alternate" content="en_US" />
      <meta property="og:image" content={ogImage} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {publishedTime ? <meta property="article:published_time" content={publishedTime} /> : null}
      {modifiedTime ? <meta property="article:modified_time" content={modifiedTime} /> : null}
      {schemas.map((schema, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
    </Helmet>
  );
}
