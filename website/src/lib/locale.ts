export function normalizeLocaleTag(tag: string): string {
  return tag.trim().toLowerCase().replace(/_/g, '-');
}

export function primaryLanguageSubtag(tag: string): string {
  const normalized = normalizeLocaleTag(tag);
  const idx = normalized.indexOf('-');
  return idx === -1 ? normalized : normalized.slice(0, idx);
}

export function localeTagsMatch(stored: string, preferred: string): boolean {
  const s = normalizeLocaleTag(stored);
  const p = normalizeLocaleTag(preferred);
  if (s === p) return true;
  return primaryLanguageSubtag(s) === primaryLanguageSubtag(p);
}
