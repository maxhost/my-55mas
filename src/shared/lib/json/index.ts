type I18nRecord = Record<string, Record<string, unknown>> | null;

/**
 * Try to parse a JSON-encoded string back to its original shape; if it isn't
 * valid JSON, return the raw string. Used when survey_responses.value (text)
 * may carry serialized arrays/objects.
 */
export function tryParseJson(value: string | null): unknown {
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/** Pick a single field (e.g. 'name') across every locale present in an i18n jsonb. */
export function extractTranslations(
  i18n: I18nRecord,
  field: string,
): Record<string, string> {
  const out: Record<string, string> = {};
  if (!i18n) return out;
  for (const [locale, entry] of Object.entries(i18n)) {
    const v = (entry as Record<string, unknown>)[field];
    if (typeof v === 'string') out[locale] = v;
  }
  return out;
}

export type { I18nRecord };
