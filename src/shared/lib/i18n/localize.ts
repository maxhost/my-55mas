export type I18nMap<T> = Record<string, T>;

export function localize<T>(
  i18n: I18nMap<T> | null | undefined,
  locale: string,
  fallbackLocale = 'es'
): T | null {
  if (!i18n || typeof i18n !== 'object') return null;
  return i18n[locale] ?? i18n[fallbackLocale] ?? null;
}

export function localizedField(
  i18n: I18nMap<Record<string, unknown>> | null | undefined,
  locale: string,
  field: string,
  fallbackLocale = 'es'
): string | null {
  const entry = localize(i18n, locale, fallbackLocale);
  if (!entry || typeof entry !== 'object') return null;
  const value = entry[field];
  return typeof value === 'string' ? value : null;
}

export function normalizeForMatch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}
