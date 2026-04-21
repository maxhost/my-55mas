import { parseSpokenLanguages } from '@/shared/lib/spoken-languages/parse';
import type { ImportLookups, RowError } from '../types';

export function resolveSpokenLanguages(
  raw: string | null,
  lookups: ImportLookups | undefined,
  rowIndex: number,
  errors: RowError[]
): string[] | null {
  // DEBUG: log raw value and alias map size
  console.log(`[resolve-spoken-languages] Row ${rowIndex}: raw =`, JSON.stringify(raw), '| aliasMap size:', lookups?.spokenLanguageAliases?.size ?? 0);
  if (!raw) return null;
  const { codes, unknown } = parseSpokenLanguages(
    raw,
    lookups?.spokenLanguageAliases ?? new Map()
  );
  // DEBUG: log resolution result
  if (unknown.length > 0) {
    console.log(`[resolve-spoken-languages] Row ${rowIndex}: codes =`, codes, '| unknown =', unknown);
  }
  for (const u of unknown) {
    errors.push({ rowIndex, message: `[warning] Unknown spoken language "${u}", skipped` });
  }
  return codes.length > 0 ? codes : null;
}
