import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STORE_PATH = path.join(__dirname, "..", "data", "cms-store.json");

let initPromise = null;
let writeQueue = Promise.resolve();
let storeCache = null;

function toPositiveInt(value, fallback) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.floor(parsed);
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function inferNextId(list) {
  if (!Array.isArray(list) || list.length === 0) {
    return 1;
  }

  const max = list.reduce((highest, item) => {
    const id = Number(item?.id);
    if (!Number.isFinite(id)) {
      return highest;
    }

    return Math.max(highest, id);
  }, 0);

  return max + 1;
}

function createDefaultSettings() {
  return {
    hero: {
      title: {
        ar: "مؤسسة غسات الكبرى: تنمية محلية بمعايير مؤسسية واضحة",
        zgh: "Tasudest n Ghassate: taneflit tanaddanit s usuddes afessas",
        en: "Ghassate Organization: local development with institutional discipline"
      },
      text: {
        ar: "نحوّل المبادرات المحلية إلى برامج قابلة للقياس مع حوكمة معلنة وتقارير أثر دورية.",
        zgh: "Nseddukel ineggura n tmurt ɣer isenfar yettwaznan s umqqim d isallen n uḍfar.",
        en: "We convert local initiatives into measurable programs with clear governance and periodic impact reporting."
      },
      badge: {
        ar: "اللغة العربية هي الواجهة الرسمية",
        zgh: "Ta3rabt d tutlayt tagejdant n usmel",
        en: "Arabic is the primary language of the platform"
      }
    },
    contact: {
      email: "contact@ghassate.org",
      phone: "+212 6 00 00 00 00",
      address: {
        ar: "غسات، إقليم ورزازات، جهة درعة تافيلالت، المملكة المغربية",
        zgh: "Ghassate, Ouarzazate, Draa-Tafilalet, Morocco",
        en: "Ghassate, Ouarzazate Province, Draa-Tafilalet Region, Kingdom of Morocco"
      }
    },
    social: {
      facebook: "https://www.facebook.com/ghassateorg",
      instagram: "https://www.instagram.com/ghassateorg",
      linkedin: "https://www.linkedin.com/company/ghassateorg",
      youtube: "https://www.youtube.com/@ghassateorg"
    },
    donation: {
      beneficiary: "Ghassate Organization",
      iban: "MA00 0000 0000 0000 0000 0000",
      bic: "GHASMA00"
    },
    legal: {
      updatedAt: "2026-02-13",
      registrationNumber: "ASSO-GHS-2026",
      taxReference: "TAX-GHASSATE-001"
    }
  };
}

function createDefaultMedia() {
  return [
    {
      id: 1,
      slug: "festival-main-stage",
      type: "image",
      title: {
        ar: "منصة المهرجان - النسخة الأخيرة",
        zgh: "Asfari n umzruy - tikkelt taneggarut",
        en: "Festival Main Stage - Latest Edition"
      },
      description: {
        ar: "لقطة من فضاء الأنشطة الثقافية خلال برنامج نوار اللوز.",
        zgh: "Tugna n usatal adelsan deg useɣru n Nwar n Luzz.",
        en: "Scene from the cultural activities area during the Almond Blossom program."
      },
      url: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622",
      thumbnail: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80",
      createdAt: "2026-02-05T10:00:00.000Z"
    },
    {
      id: 2,
      slug: "youth-training-lab",
      type: "video",
      title: {
        ar: "مختبر التكوين الشبابي",
        zgh: "Axxam n usegmi n yimeẓyanen",
        en: "Youth Training Lab"
      },
      description: {
        ar: "فيديو قصير يوثق ورشات المهارات الرقمية.",
        zgh: "Avidyu amezzyan i yesseknen tizegzewin timḍinin.",
        en: "Short video documenting digital skills workshops."
      },
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      createdAt: "2026-01-30T09:00:00.000Z"
    }
  ];
}

function createSeed({ projects = [], news = [], impact = {} } = {}) {
  const seededProjects = clone(projects);
  const seededNews = clone(news);
  const seededImpact = clone(impact);
  const seededMedia = createDefaultMedia();

  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    settings: createDefaultSettings(),
    projects: seededProjects,
    news: seededNews,
    impact: seededImpact,
    media: seededMedia,
    nextIds: {
      projects: inferNextId(seededProjects),
      news: inferNextId(seededNews),
      media: inferNextId(seededMedia)
    }
  };
}

function mergeWithSeed(rawStore, seedStore) {
  const raw = rawStore && typeof rawStore === "object" ? rawStore : {};
  const merged = {
    ...seedStore,
    ...raw,
    settings: raw.settings && typeof raw.settings === "object" ? raw.settings : seedStore.settings,
    projects: Array.isArray(raw.projects) ? raw.projects : seedStore.projects,
    news: Array.isArray(raw.news) ? raw.news : seedStore.news,
    impact: raw.impact && typeof raw.impact === "object" ? raw.impact : seedStore.impact,
    media: Array.isArray(raw.media) ? raw.media : seedStore.media
  };

  const inferredProjects = inferNextId(merged.projects);
  const inferredNews = inferNextId(merged.news);
  const inferredMedia = inferNextId(merged.media);

  merged.nextIds = {
    projects: toPositiveInt(raw?.nextIds?.projects, inferredProjects),
    news: toPositiveInt(raw?.nextIds?.news, inferredNews),
    media: toPositiveInt(raw?.nextIds?.media, inferredMedia)
  };

  return merged;
}

async function writeStore(data) {
  await fs.mkdir(path.dirname(STORE_PATH), { recursive: true });
  await fs.writeFile(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
}

export async function initializeCmsStore(seedInput) {
  if (initPromise) {
    return clone(await initPromise);
  }

  initPromise = (async () => {
    const seed = createSeed(seedInput);
    let nextStore = seed;

    try {
      const raw = await fs.readFile(STORE_PATH, "utf8");
      const parsed = JSON.parse(raw);
      nextStore = mergeWithSeed(parsed, seed);
    } catch {
      nextStore = seed;
    }

    await writeStore(nextStore);
    storeCache = nextStore;
    return storeCache;
  })();

  return clone(await initPromise);
}

async function ensureInitialized() {
  if (!initPromise) {
    throw new Error("CMS store is not initialized.");
  }

  await initPromise;
}

export async function getCmsStore() {
  await ensureInitialized();
  return clone(storeCache);
}

export async function updateCmsStore(updater) {
  await ensureInitialized();
  const draft = clone(storeCache);
  const updaterResult = await updater(draft);

  draft.version = 1;
  draft.updatedAt = new Date().toISOString();
  draft.nextIds = {
    projects: toPositiveInt(draft?.nextIds?.projects, inferNextId(draft.projects)),
    news: toPositiveInt(draft?.nextIds?.news, inferNextId(draft.news)),
    media: toPositiveInt(draft?.nextIds?.media, inferNextId(draft.media))
  };

  writeQueue = writeQueue.then(async () => {
    await writeStore(draft);
    storeCache = draft;
  });

  await writeQueue;
  return {
    store: clone(storeCache),
    result: updaterResult
  };
}
