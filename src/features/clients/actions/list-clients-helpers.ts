// ── Types for localized view rows ───────────────────

export type LocalizedRow = {
  id: string | null;
  name: string | null;
};

// ── buildNameMap ────────────────────────────────────

export function buildNameMap(rows: LocalizedRow[]): Map<string, string> {
  const map = new Map<string, string>();

  for (const row of rows) {
    if (row.id && row.name) {
      map.set(row.id, row.name);
    }
  }

  return map;
}
