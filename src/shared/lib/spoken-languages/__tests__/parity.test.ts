import { describe, expect, it } from 'vitest';
import { normalizeAlias } from '../normalize';

/**
 * Paridad con la normalización SQL usada en el seed de spoken_language_aliases.
 * Cada entry es (original_text seeded → alias_normalized seeded).
 * normalizeAlias(original) debe producir el mismo resultado que la SQL de seed.
 */
const DB_PAIRS: Array<[string, string]> = [
  ['Africâner', 'africaner'],
  ['Árabe', 'arabe'],
  ['Búlgaro', 'bulgaro'],
  ['Dinamarquês', 'dinamarques'],
  ['Alemanha', 'alemanha'],
  ['alemão', 'alemao'],
  ['Alemão intermédio', 'alemao intermedio'],
  ['Português', 'portugues'],
  ['Português para estrangeiros', 'portugues para estrangeiros'],
  ['Italiano intermédio/materna', 'italiano intermediomaterna'],
];

describe('normalizeAlias parity with DB seed', () => {
  for (const [original, expected] of DB_PAIRS) {
    it(`normalizes "${original}" to "${expected}"`, () => {
      expect(normalizeAlias(original)).toBe(expected);
    });
  }
});
