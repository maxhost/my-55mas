import { describe, expect, it } from 'vitest';
import { parseSpokenLanguages } from '../parse';
import type { SpokenLanguageAliasMap } from '../types';

function buildAliases(): SpokenLanguageAliasMap {
  const map: SpokenLanguageAliasMap = new Map();
  map.set('portugues', 'pt');
  map.set('portugues para estrangeiros', 'pt');
  map.set('italiano', 'it');
  map.set('italiano intermedio materna', 'it');
  map.set('alemao', 'de');
  map.set('ingles', 'en');
  map.set('english', 'en');
  map.set('espanhol', 'es');
  map.set('castelhano', 'es');
  return map;
}

describe('parseSpokenLanguages', () => {
  const aliases = buildAliases();

  it('returns empty arrays for empty input', () => {
    expect(parseSpokenLanguages('', aliases)).toEqual({ codes: [], unknown: [] });
  });

  it('parses a single token', () => {
    expect(parseSpokenLanguages('Português', aliases)).toEqual({
      codes: ['pt'],
      unknown: [],
    });
  });

  it('parses multiple tokens separated by comma', () => {
    const result = parseSpokenLanguages('Português, Italiano', aliases);
    expect(result.codes.sort()).toEqual(['it', 'pt']);
    expect(result.unknown).toEqual([]);
  });

  it('parses tokens separated by semicolon', () => {
    const result = parseSpokenLanguages('Português; Italiano', aliases);
    expect(result.codes.sort()).toEqual(['it', 'pt']);
  });

  it('parses tokens separated by slash', () => {
    const result = parseSpokenLanguages('Português / Italiano', aliases);
    expect(result.codes.sort()).toEqual(['it', 'pt']);
  });

  it('parses tokens separated by newline', () => {
    const result = parseSpokenLanguages('Português\nItaliano', aliases);
    expect(result.codes.sort()).toEqual(['it', 'pt']);
  });

  it('deduplicates repeated codes (Castelhano + Espanhol both → es)', () => {
    const result = parseSpokenLanguages('Castelhano, Espanhol', aliases);
    expect(result.codes).toEqual(['es']);
    expect(result.unknown).toEqual([]);
  });

  it('normalizes accents and casing before lookup', () => {
    const result = parseSpokenLanguages('PORTUGUÊS, italiano', aliases);
    expect(result.codes.sort()).toEqual(['it', 'pt']);
  });

  it('captures unknown tokens', () => {
    const result = parseSpokenLanguages('Português, Klingon', aliases);
    expect(result.codes).toEqual(['pt']);
    expect(result.unknown).toEqual(['Klingon']);
  });

  it('handles whitespace padding between tokens', () => {
    const result = parseSpokenLanguages('  Português  ,   Italiano  ', aliases);
    expect(result.codes.sort()).toEqual(['it', 'pt']);
  });

  it('resolves multi-word variant "Português para estrangeiros"', () => {
    const result = parseSpokenLanguages('Português para estrangeiros', aliases);
    expect(result.codes).toEqual(['pt']);
  });
});
