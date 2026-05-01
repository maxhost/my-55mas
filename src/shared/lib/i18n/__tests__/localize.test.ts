import { describe, it, expect } from 'vitest';
import { localize, localizedField, normalizeForMatch } from '../localize';

describe('localize', () => {
  it('returns the entry for the requested locale', () => {
    const i18n = { es: { name: 'Hola' }, en: { name: 'Hello' } };
    expect(localize(i18n, 'es')).toEqual({ name: 'Hola' });
    expect(localize(i18n, 'en')).toEqual({ name: 'Hello' });
  });

  it('falls back to fallbackLocale when locale missing', () => {
    const i18n = { es: { name: 'Hola' } };
    expect(localize(i18n, 'fr')).toEqual({ name: 'Hola' });
  });

  it('returns null when neither locale nor fallback present', () => {
    const i18n = { fr: { name: 'Bonjour' } };
    expect(localize(i18n, 'pt', 'es')).toBeNull();
  });

  it('returns null for null/undefined/non-object', () => {
    expect(localize(null, 'es')).toBeNull();
    expect(localize(undefined, 'es')).toBeNull();
  });

  it('respects custom fallback locale', () => {
    const i18n = { en: { name: 'Hello' } };
    expect(localize(i18n, 'pt', 'en')).toEqual({ name: 'Hello' });
  });
});

describe('localizedField', () => {
  it('extracts a string field from the localized entry', () => {
    const i18n = { es: { name: 'Hola', description: 'Saludo' } };
    expect(localizedField(i18n, 'es', 'name')).toBe('Hola');
    expect(localizedField(i18n, 'es', 'description')).toBe('Saludo');
  });

  it('returns null when field missing or not a string', () => {
    const i18n = { es: { name: 'Hola' } };
    expect(localizedField(i18n, 'es', 'description')).toBeNull();
    const i18nNonString = { es: { items: [1, 2, 3] } } as unknown as Record<
      string,
      Record<string, unknown>
    >;
    expect(localizedField(i18nNonString, 'es', 'items')).toBeNull();
  });

  it('falls back through locale chain', () => {
    const i18n = { es: { name: 'Hola' } };
    expect(localizedField(i18n, 'fr', 'name')).toBe('Hola');
  });

  it('returns null when i18n missing', () => {
    expect(localizedField(null, 'es', 'name')).toBeNull();
  });
});

describe('normalizeForMatch', () => {
  it('lowercases the string', () => {
    expect(normalizeForMatch('Hello')).toBe('hello');
  });

  it('strips accents', () => {
    expect(normalizeForMatch('Reparación')).toBe('reparacion');
    expect(normalizeForMatch('São Paulo')).toBe('sao paulo');
    expect(normalizeForMatch('Loulé')).toBe('loule');
  });

  it('trims whitespace', () => {
    expect(normalizeForMatch('  hello  ')).toBe('hello');
  });

  it('matches accent-variants when normalized', () => {
    expect(normalizeForMatch('Carpinteria')).toBe(normalizeForMatch('Carpintería'));
    expect(normalizeForMatch('PLOMERIA')).toBe(normalizeForMatch('plomería'));
  });
});
