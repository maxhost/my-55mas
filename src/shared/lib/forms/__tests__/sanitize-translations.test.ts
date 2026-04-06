import { describe, it, expect } from 'vitest';
import { sanitizeTranslations } from '../sanitize-translations';
import type { FormSchema, FormTranslationData } from '../types';

// ── Helpers ──────────────────────────────────────────

function trans(
  labels: Record<string, string> = {},
  placeholders: Record<string, string> = {},
  option_labels: Record<string, string> = {},
): FormTranslationData {
  return { labels, placeholders, option_labels };
}

function schema(...steps: { key: string; fields: { key: string; options?: string[] }[]; actions?: { key: string }[] }[]): FormSchema {
  return {
    steps: steps.map((s) => ({
      key: s.key,
      fields: s.fields.map((f) => ({ key: f.key, type: 'text' as const, required: false, options: f.options })),
      actions: s.actions?.map((a) => ({ key: a.key, type: 'next' as const })),
    })),
  };
}

// ── sanitizeTranslations ────────────────────────────

describe('sanitizeTranslations', () => {
  it('removes label of deleted field', () => {
    const s = schema({ key: 's1', fields: [{ key: 'a' }] });
    const translations = {
      es: trans({ s1: 'Paso 1', a: 'Campo A', deleted_field: 'Ghost' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result.es.labels).toEqual({ s1: 'Paso 1', a: 'Campo A' });
    expect(result.es.labels['deleted_field']).toBeUndefined();
  });

  it('removes placeholder of deleted field', () => {
    const s = schema({ key: 's1', fields: [{ key: 'a' }] });
    const translations = {
      es: trans({}, { a: 'Escribe aquí', deleted: 'Ghost placeholder' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result.es.placeholders).toEqual({ a: 'Escribe aquí' });
  });

  it('removes label of deleted step', () => {
    const s = schema({ key: 's1', fields: [{ key: 'a' }] });
    const translations = {
      es: trans({ s1: 'Paso 1', s2: 'Paso eliminado', a: 'Campo A' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result.es.labels['s2']).toBeUndefined();
    expect(result.es.labels['s1']).toBe('Paso 1');
  });

  it('removes label of deleted action', () => {
    const s = schema({ key: 's1', fields: [{ key: 'a' }], actions: [{ key: 'btn_next' }] });
    const translations = {
      es: trans({ s1: 'Paso', a: 'Campo', btn_next: 'Siguiente', btn_deleted: 'Ghost' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result.es.labels['btn_next']).toBe('Siguiente');
    expect(result.es.labels['btn_deleted']).toBeUndefined();
  });

  it('preserves labels and placeholders of existing fields', () => {
    const s = schema({ key: 's1', fields: [{ key: 'a' }, { key: 'b' }] });
    const translations = {
      es: trans({ s1: 'Paso', a: 'Nombre', b: 'Email' }, { a: 'Tu nombre', b: 'Tu email' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result.es.labels).toEqual({ s1: 'Paso', a: 'Nombre', b: 'Email' });
    expect(result.es.placeholders).toEqual({ a: 'Tu nombre', b: 'Tu email' });
  });

  it('removes orphaned option_labels (fieldKey.optionValue where fieldKey deleted)', () => {
    const s = schema({ key: 's1', fields: [{ key: 'a', options: ['opt1'] }] });
    const translations = {
      es: trans({}, {}, { 'a.opt1': 'Opción 1', 'deleted.opt1': 'Ghost', 'deleted.opt2': 'Ghost 2' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result.es.option_labels).toEqual({ 'a.opt1': 'Opción 1' });
  });

  it('preserves option_labels of existing fields', () => {
    const s = schema({ key: 's1', fields: [{ key: 'gender', options: ['m', 'f'] }] });
    const translations = {
      es: trans({}, {}, { 'gender.m': 'Masculino', 'gender.f': 'Femenino' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result.es.option_labels).toEqual({ 'gender.m': 'Masculino', 'gender.f': 'Femenino' });
  });

  it('works with multiple locales', () => {
    const s = schema({ key: 's1', fields: [{ key: 'a' }] });
    const translations = {
      es: trans({ s1: 'Paso', a: 'Nombre', orphan: 'X' }),
      en: trans({ s1: 'Step', a: 'Name', orphan: 'Y' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result.es.labels).toEqual({ s1: 'Paso', a: 'Nombre' });
    expect(result.en.labels).toEqual({ s1: 'Step', a: 'Name' });
  });

  it('is idempotent — no change if no orphans', () => {
    const s = schema({ key: 's1', fields: [{ key: 'a' }] });
    const translations = {
      es: trans({ s1: 'Paso', a: 'Nombre' }, { a: 'placeholder' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result).toEqual(translations);
  });

  it('handles empty schema (no steps)', () => {
    const s: FormSchema = { steps: [] };
    const translations = {
      es: trans({ orphan: 'Ghost' }, { orphan: 'Ghost' }),
    };

    const result = sanitizeTranslations(s, translations);
    expect(result.es.labels).toEqual({});
    expect(result.es.placeholders).toEqual({});
  });
});
