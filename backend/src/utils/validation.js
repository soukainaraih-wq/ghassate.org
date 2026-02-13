const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const controlCharsRegex = /[\u0000-\u001F\u007F]/g;
const bidiControlCharsRegex = /[\u202A-\u202E\u2066-\u2069]/g;
const angleBracketsRegex = /[<>]/g;
const slugRegex = /^[a-z0-9-]{2,100}$/;

const limits = {
  nameMin: 2,
  nameMax: 120,
  emailMax: 254,
  subjectMin: 4,
  subjectMax: 180,
  messageMin: 20,
  messageMax: 4000
};

const allowedContactKeys = new Set([
  "name",
  "email",
  "subject",
  "message",
  "lang",
  "website",
  "company",
  "nickname",
  "formStartedAt"
]);

const allowedNewsletterKeys = new Set([
  "email",
  "lang",
  "website",
  "company",
  "nickname",
  "formStartedAt"
]);

function toNumber(value, fallback, min = 1, max = Number.MAX_SAFE_INTEGER) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(Math.max(parsed, min), max);
}

const MIN_FORM_FILL_MS = toNumber(process.env.MIN_FORM_FILL_MS, 1200, 300, 60000);
const MAX_FORM_AGE_MS = toNumber(process.env.MAX_FORM_AGE_MS, 86400000, 60000, 1209600000);

export function normalizeLang(value) {
  if (value === "en") {
    return "en";
  }

  if (value === "zgh") {
    return "zgh";
  }

  return "ar";
}

function isObjectPayload(payload) {
  return Boolean(payload) && typeof payload === "object" && !Array.isArray(payload);
}

function getUnknownKeys(payload, allowedKeys) {
  if (!isObjectPayload(payload)) {
    return [];
  }

  return Object.keys(payload).filter((key) => !allowedKeys.has(key));
}

export function normalizeText(value) {
  if (typeof value !== "string") {
    return "";
  }

  return value
    .replace(controlCharsRegex, " ")
    .replace(bidiControlCharsRegex, "")
    .replace(angleBracketsRegex, "")
    .replace(/\s+/g, " ")
    .trim();
}

function exceedsLength(value, max) {
  return value.length > max;
}

function isHoneypotTriggered(payload) {
  const website = normalizeText(payload?.website);
  const company = normalizeText(payload?.company);
  const nickname = normalizeText(payload?.nickname);

  return website.length > 0 || company.length > 0 || nickname.length > 0;
}

function validateFormTiming(payload) {
  const startedAtRaw = payload?.formStartedAt;
  const startedAt = Number(startedAtRaw);
  if (!Number.isFinite(startedAt) || startedAt <= 0) {
    return false;
  }

  const now = Date.now();
  const elapsed = now - startedAt;

  if (elapsed < MIN_FORM_FILL_MS || elapsed > MAX_FORM_AGE_MS) {
    return false;
  }

  if (startedAt > now + 5000) {
    return false;
  }

  return true;
}

export function isValidSlug(value) {
  return slugRegex.test(value || "");
}

export function validateContactInput(payload) {
  const errors = {};
  const source = isObjectPayload(payload) ? payload : {};

  if (!isObjectPayload(payload)) {
    errors.payload = "Invalid payload.";
  }

  if (getUnknownKeys(source, allowedContactKeys).length > 0) {
    errors.payload = "Unexpected fields.";
  }

  const name = normalizeText(source.name);
  const email = normalizeText(source.email).toLowerCase();
  const subject = normalizeText(source.subject);
  const message = normalizeText(source.message);
  const lang = normalizeLang(source.lang);

  if (isHoneypotTriggered(source) || !validateFormTiming(source)) {
    errors.bot = "Automation detected.";
  }

  if (name.length < limits.nameMin || exceedsLength(name, limits.nameMax)) {
    errors.name = `Name must be between ${limits.nameMin} and ${limits.nameMax} characters.`;
  }

  if (!emailRegex.test(email) || exceedsLength(email, limits.emailMax)) {
    errors.email = "Email is invalid.";
  }

  if (subject.length < limits.subjectMin || exceedsLength(subject, limits.subjectMax)) {
    errors.subject = `Subject must be between ${limits.subjectMin} and ${limits.subjectMax} characters.`;
  }

  if (message.length < limits.messageMin || exceedsLength(message, limits.messageMax)) {
    errors.message = `Message must be between ${limits.messageMin} and ${limits.messageMax} characters.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { name, email, subject, message, lang }
  };
}

export function validateNewsletterInput(payload) {
  const errors = {};
  const source = isObjectPayload(payload) ? payload : {};

  if (!isObjectPayload(payload)) {
    errors.payload = "Invalid payload.";
  }

  if (getUnknownKeys(source, allowedNewsletterKeys).length > 0) {
    errors.payload = "Unexpected fields.";
  }

  const email = normalizeText(source.email).toLowerCase();
  const lang = normalizeLang(source.lang);

  if (isHoneypotTriggered(source) || !validateFormTiming(source)) {
    errors.bot = "Automation detected.";
  }

  if (!emailRegex.test(email) || exceedsLength(email, limits.emailMax)) {
    errors.email = "Email is invalid.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: { email, lang }
  };
}
