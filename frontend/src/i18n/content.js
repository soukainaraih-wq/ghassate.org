export const SITE_ORIGIN = "https://ghassate.org";
export const SUPPORTED_LANGS = ["ar", "zgh", "en"];

export function isValidLang(lang) {
  return SUPPORTED_LANGS.includes(lang);
}

export function buildPath(lang, slug = "") {
  const normalized = slug ? `/${slug.replace(/^\/+/, "")}` : "";
  return `/${lang}${normalized}`;
}

export function getLanguageOptions() {
  return [
    { code: "ar", label: "AR" },
    { code: "zgh", label: "ⵣⵖ" },
    { code: "en", label: "EN" }
  ];
}

export const siteContent = {
  ar: {
    dir: "rtl",
    siteName: "مؤسسة غسات الكبرى",
    siteNameAmazigh: "ⵜⴰⵙⵓⴷⵙⵜ ⵏ ⵖⵙⴰⵜ ⵜⴰⵎⵇⵇⵯⵔⴰⵏⵜ",
    nav: {
      home: "الرئيسية",
      about: "من نحن",
      team: "أعضاء المكتب",
      projects: "المشاريع",
      news: "الأخبار",
      integrity: "ميثاق النزاهة",
      membership: "انخرط معنا",
      privacy: "سياسة الخصوصية",
      contact: "اتصل بنا",
      donate: "تبرع",
      dashboard: "لوحة التحكم"
    },
    common: {
      readMore: "اقرأ المزيد",
      send: "إرسال",
      subscribe: "اشترك",
      loading: "جاري التحميل..."
    },
    footer: {
      about:
        "مؤسسة غسات الكبرى تعمل بمنهج مؤسسي واضح لتحويل المبادرات المحلية إلى أثر تنموي قابل للقياس.",
      governance:
        "نلتزم بالشفافية، النزاهة، ونشر تقارير دورية تدعم الثقة مع المجتمع والشركاء.",
      quickLinks: "روابط سريعة",
      governanceLinks: "الحوكمة والامتثال",
      support: "الدعم",
      addressTitle: "العنوان الرسمي",
      address: "غسات، إقليم ورزازات، جهة درعة تافيلالت، المملكة المغربية",
      social: "مواقع التواصل",
      rights: "جميع الحقوق محفوظة."
    },
    seo: {
      homeTitle: "مؤسسة غسات الكبرى | منصة تنموية مؤسسية بشفافية قابلة للقياس",
      homeDescription:
        "الموقع الرسمي لمؤسسة غسات الكبرى: مشاريع تنموية، أعضاء المكتب، ميثاق النزاهة، وتقارير موثقة للأثر."
    }
  },
  zgh: {
    dir: "ltr",
    siteName: "Tasudest n Ghassate Tamqqwrant",
    siteNameAmazigh: "ⵜⴰⵙⵓⴷⵙⵜ ⵏ ⵖⵙⴰⵜ ⵜⴰⵎⵇⵇⵯⵔⴰⵏⵜ",
    nav: {
      home: "Asebter agejdan",
      about: "Anwa nkwni",
      team: "Imdanen n lmaktab",
      projects: "Isenfar",
      news: "Inghmisen",
      integrity: "Amur n nnezaha",
      membership: "Kcem d ameddukal",
      privacy: "Tasertit n tba3diyt",
      contact: "Nermes-a",
      donate: "Tawsa",
      dashboard: "Tafelwit n usenqed"
    },
    common: {
      readMore: "Qra ugar",
      send: "Azen",
      subscribe: "Jjujjed",
      loading: "Asali..."
    },
    footer: {
      about:
        "Tasudest n Ghassate Tamqqwrant tessnker ineggura n tmurt s usnulfu d useqqim i yettwaznan.",
      governance:
        "Nettzammam s tnezzaha, tafrawant, d usufegh n isallen s umeknas iwakken ad yili umnenni.",
      quickLinks: "Iseɣwan arurad",
      governanceLinks: "Anefraz d umqqim",
      support: "Tawsa",
      addressTitle: "Tansa tunṣibt",
      address: "Ghassate, Ouarzazate, Draa-Tafilalet, Morocco",
      social: "Aẓeṭṭa n timwatin",
      rights: "Akk izerfan d wid n tsudest."
    },
    seo: {
      homeTitle: "Tasudest n Ghassate Tamqqwrant | Asmel n tneflit tanaddanit",
      homeDescription:
        "Asmel unṣib n Tsudest n Ghassate: isenfar n tneflit, imdanen n lmaktab, amur n nnezaha d isallen yettewasnen."
    }
  },
  en: {
    dir: "ltr",
    siteName: "Ghassate Organization",
    siteNameAmazigh: "ⵜⴰⵙⵓⴷⵙⵜ ⵏ ⵖⵙⴰⵜ ⵜⴰⵎⵇⵇⵯⵔⴰⵏⵜ",
    nav: {
      home: "Home",
      about: "About",
      team: "Leadership Team",
      projects: "Projects",
      news: "News",
      integrity: "Integrity Charter",
      membership: "Join Us",
      privacy: "Privacy Policy",
      contact: "Contact",
      donate: "Donate",
      dashboard: "Dashboard"
    },
    common: {
      readMore: "Read more",
      send: "Send",
      subscribe: "Subscribe",
      loading: "Loading..."
    },
    footer: {
      about:
        "Ghassate Organization turns local initiatives into measurable development outcomes through structured delivery.",
      governance:
        "Our governance model is built on integrity, transparent reporting, and accountable implementation.",
      quickLinks: "Quick links",
      governanceLinks: "Governance",
      support: "Support",
      addressTitle: "Official Address",
      address: "Ghassate, Ouarzazate Province, Draa-Tafilalet Region, Kingdom of Morocco",
      social: "Social Media",
      rights: "All rights reserved."
    },
    seo: {
      homeTitle: "Ghassate Organization | Measurable Local Development Platform",
      homeDescription:
        "Official website of Ghassate Organization: development programs, leadership team, integrity charter, and verified impact updates."
    }
  }
};

export function getContent(lang) {
  return siteContent[lang] || siteContent.ar;
}
