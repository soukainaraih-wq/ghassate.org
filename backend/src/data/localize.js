export function pickLocalized(map, lang) {
  return map?.[lang] || map?.ar || map?.zgh || map?.en || "";
}

export function pickLocalizedList(map, lang) {
  const picked = map?.[lang] || map?.ar || map?.zgh || map?.en || [];
  return Array.isArray(picked) ? picked : [];
}
