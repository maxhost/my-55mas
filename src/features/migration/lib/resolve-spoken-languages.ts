import { parseSpokenLanguages } from '@/shared/lib/spoken-languages/parse';
import type { ImportLookups, RowError } from '../types';

export function resolveSpokenLanguages(
  raw: string | null,
  lookups: ImportLookups | undefined,
  rowIndex: number,
  errors: RowError[]
): string[] | null {
  if (!raw) return null;
  const { codes, unknown } = parseSpokenLanguages(
    raw,
    lookups?.spokenLanguageAliases ?? new Map()
  );
  for (const u of unknown) {
    errors.push({ rowIndex, message: `[warning] Unknown spoken language "${u}", skipped` });
  }
  return codes.length > 0 ? codes : null;
}
