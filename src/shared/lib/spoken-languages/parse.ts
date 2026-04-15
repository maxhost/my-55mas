import { normalizeAlias } from './normalize';
import type { SpokenLanguageAliasMap, SpokenLanguageCode } from './types';

export function parseSpokenLanguages(
  raw: string,
  aliases: SpokenLanguageAliasMap
): { codes: SpokenLanguageCode[]; unknown: string[] } {
  if (!raw) return { codes: [], unknown: [] };

  const tokens = raw.split(/[,;/\n]/).map((t) => t.trim()).filter(Boolean);
  const codes = new Set<SpokenLanguageCode>();
  const unknown: string[] = [];

  for (const token of tokens) {
    const norm = normalizeAlias(token);
    if (!norm) continue;
    const code = aliases.get(norm);
    if (code) {
      codes.add(code);
    } else {
      unknown.push(token);
    }
  }

  return { codes: Array.from(codes), unknown };
}
