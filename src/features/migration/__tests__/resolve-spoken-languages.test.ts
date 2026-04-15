import { describe, it, expect } from 'vitest';
import { resolveSpokenLanguages } from '../lib/resolve-spoken-languages';
import type { ImportLookups, RowError } from '../types';

function makeLookups(entries: [string, string][]): ImportLookups {
  return {
    citiesByName: new Map(),
    countriesByName: new Map(),
    defaultCountryId: null,
    spokenLanguageAliases: new Map(entries),
  };
}

describe('resolveSpokenLanguages — alias→canonical code contract', () => {
  it("resolves alias 'Alemanha' to canonical code 'de', not the alias string", () => {
    const lookups = makeLookups([['alemanha', 'de']]);
    const errors: RowError[] = [];

    const result = resolveSpokenLanguages('Alemanha', lookups, 0, errors);

    expect(result).toEqual(['de']);
    expect(errors).toHaveLength(0);
  });

  it("resolves translation-form alias 'Portuguese' to 'pt'", () => {
    const lookups = makeLookups([['portuguese', 'pt']]);
    const errors: RowError[] = [];

    const result = resolveSpokenLanguages('Portuguese', lookups, 3, errors);

    expect(result).toEqual(['pt']);
    expect(errors).toHaveLength(0);
  });

  it('resolves multi-value raw string and deduplicates repeated languages', () => {
    const lookups = makeLookups([
      ['portugues', 'pt'],
      ['portuguese', 'pt'],
      ['italiano', 'it'],
    ]);
    const errors: RowError[] = [];

    const result = resolveSpokenLanguages(
      'Português, Italiano, Portuguese',
      lookups,
      5,
      errors
    );

    expect(result).not.toBeNull();
    expect(result!.sort()).toEqual(['it', 'pt']);
    expect(errors).toHaveLength(0);
  });

  it('returns null and pushes a warning for an unknown token', () => {
    const lookups = makeLookups([]);
    const errors: RowError[] = [];

    const result = resolveSpokenLanguages('Klingon', lookups, 7, errors);

    expect(result).toBeNull();
    expect(errors).toHaveLength(1);
    expect(errors[0].rowIndex).toBe(7);
    expect(errors[0].message).toContain('Klingon');
  });
});
