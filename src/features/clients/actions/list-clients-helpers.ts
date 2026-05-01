import { localizedField } from '@/shared/lib/i18n/localize';

export type I18nRow = {
  id: string | null;
  i18n: Record<string, Record<string, unknown>> | null | unknown;
};

export function buildNameMap(rows: I18nRow[], locale: string): Map<string, string> {
  const map = new Map<string, string>();

  for (const row of rows) {
    if (!row.id) continue;
    const i18n = (row.i18n ?? {}) as Record<string, Record<string, unknown>>;
    const name = localizedField(i18n, locale, 'name');
    if (name) map.set(row.id, name);
  }

  return map;
}
