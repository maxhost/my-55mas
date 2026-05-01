import { localizedField } from '@/shared/lib/i18n/localize';

// ── Types for raw DB rows ───────────────────────────

export type I18nRow = {
  id: string | null;
  i18n: Record<string, Record<string, unknown>> | null | unknown;
};

export type TeamMemberRow = {
  user_id: string;
  team_id: string;
  teams: { id: string; name: string } | null;
};

// ── buildNameMap ────────────────────────────────────

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

// ── buildTeamsMap ───────────────────────────────────

export function buildTeamsMap(
  rows: TeamMemberRow[]
): Map<string, { id: string; name: string }[]> {
  const map = new Map<string, { id: string; name: string }[]>();

  for (const row of rows) {
    if (!row.teams) continue;
    if (!map.has(row.user_id)) {
      map.set(row.user_id, []);
    }
    map.get(row.user_id)!.push({ id: row.teams.id, name: row.teams.name });
  }

  return map;
}
