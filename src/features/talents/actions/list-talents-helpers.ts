import type { TalentServiceChip } from '../types';

// ── Types for raw DB rows ───────────────────────────

export type TalentServiceRow = {
  talent_id: string;
  service_name: string | null;
};

export type OrderRow = {
  talent_id: string | null;
  price_total: number;
};

// ── buildServicesMap ────────────────────────────────

export function buildServicesMap(
  rows: TalentServiceRow[]
): Map<string, TalentServiceChip[]> {
  const map = new Map<string, TalentServiceChip[]>();

  for (const row of rows) {
    if (!row.service_name) continue;

    if (!map.has(row.talent_id)) {
      map.set(row.talent_id, []);
    }
    const existing = map.get(row.talent_id)!;
    if (!existing.some((s) => s.name === row.service_name)) {
      existing.push({ name: row.service_name });
    }
  }

  return map;
}

// ── buildNameMap (for i18n jsonb country/city) ─

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

// ── buildEarningsMap ────────────────────────────────

export function buildEarningsMap(rows: OrderRow[]): Map<string, number> {
  const map = new Map<string, number>();

  for (const row of rows) {
    if (!row.talent_id) continue;
    map.set(row.talent_id, (map.get(row.talent_id) ?? 0) + row.price_total);
  }

  return map;
}
