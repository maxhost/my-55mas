/**
 * Build a Map<id, name> from an array of { id, name } rows.
 */
export function buildNameMap(
  rows: { id: string; name: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.id, row.name);
  }
  return map;
}

/**
 * Build a Map<id, name> from service translation rows (service_id field).
 */
export function buildServiceNameMap(
  rows: { service_id: string; name: string }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.service_id, row.name);
  }
  return map;
}

/**
 * Build a Map<id, full_name> from profile rows.
 */
export function buildProfileNameMap(
  rows: { id: string; full_name: string | null }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    if (row.full_name) map.set(row.id, row.full_name);
  }
  return map;
}

/**
 * Build a Map<id, "firstName lastName"> from staff profile rows.
 */
export function buildStaffNameMap(
  rows: { id: string; first_name: string | null; last_name: string | null }[]
): Map<string, string> {
  const map = new Map<string, string>();
  for (const row of rows) {
    const name = `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
    if (name) map.set(row.id, name);
  }
  return map;
}
