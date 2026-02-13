function toBoolean(value) {
  return String(value || "")
    .trim()
    .toLowerCase() === "true";
}

function normalizePathSegment(value) {
  return String(value || "")
    .trim()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "")
    .replace(/\s+/g, "-");
}

const forceStatic = toBoolean(import.meta.env.VITE_FORCE_STATIC);
const minDashboardSecretLength = Math.max(16, Number(import.meta.env.VITE_DASHBOARD_SECRET_MIN_LENGTH || 24) || 24);

// API mode is default. Enable static-only mode explicitly with VITE_FORCE_STATIC=true.
export const STATIC_MODE = forceStatic;

const explicitDashboardSecretPath = normalizePathSegment(import.meta.env.VITE_DASHBOARD_SECRET_PATH);
const hasSecureDashboardPath = explicitDashboardSecretPath.length >= minDashboardSecretLength;
export const DASHBOARD_SECRET_PATH = hasSecureDashboardPath ? explicitDashboardSecretPath : "";

const explicitDashboard = import.meta.env.VITE_ENABLE_DASHBOARD;
export const DASHBOARD_ENABLED =
  explicitDashboard === undefined || explicitDashboard === null
    ? hasSecureDashboardPath
    : toBoolean(explicitDashboard) && hasSecureDashboardPath;
