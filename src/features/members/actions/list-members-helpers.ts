// ── Types for raw DB rows ───────────────────────────

export type LocalizedRow = {
  id: string | null;
  name: string | null;
};

export type TeamMemberRow = {
  user_id: string;
  team_id: string;
  teams: { id: string; name: string } | null;
};

// ── buildNameMap ────────────────────────────────────

export function buildNameMap(rows: LocalizedRow[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.id && row.name) map.set(row.id, row.name);
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
