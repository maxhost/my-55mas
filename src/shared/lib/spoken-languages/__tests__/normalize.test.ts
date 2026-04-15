import { describe, expect, it } from 'vitest';
import { normalizeAlias } from '../normalize';

describe('normalizeAlias', () => {
  it('lowercases simple strings', () => {
    expect(normalizeAlias('English')).toBe('english');
  });

  it('strips accents/diacritics', () => {
    expect(normalizeAlias('Português')).toBe('portugues');
    expect(normalizeAlias('Alemão')).toBe('alemao');
    expect(normalizeAlias('Français')).toBe('francais');
    expect(normalizeAlias('Árabe')).toBe('arabe');
  });

  it('strips symbols and punctuation without inserting spaces', () => {
    expect(normalizeAlias('Italiano intermédio/materna')).toBe(
      'italiano intermediomaterna'
    );
    expect(normalizeAlias('Português!')).toBe('portugues');
  });

  it('collapses multiple whitespaces', () => {
    expect(normalizeAlias('Português    para   estrangeiros')).toBe(
      'portugues para estrangeiros'
    );
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeAlias('  English  ')).toBe('english');
  });

  it('returns empty string for empty input', () => {
    expect(normalizeAlias('')).toBe('');
    expect(normalizeAlias('   ')).toBe('');
  });
});
