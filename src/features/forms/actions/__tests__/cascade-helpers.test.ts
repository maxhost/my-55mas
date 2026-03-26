import { describe, it, expect } from 'vitest';
import {
  getVariantOnlyFieldKeys,
  cascadeSchema,
  cascadeTranslations,
} from '../cascade-helpers';
import type { FormSchema, FormTranslationData } from '../../types';

// ── Helpers ──────────────────────────────────────────────

function schema(...steps: { key: string; fields: { key: string }[] }[]): FormSchema {
  return {
    steps: steps.map((s) => ({
      key: s.key,
      fields: s.fields.map((f) => ({ key: f.key, type: 'text' as const, required: false })),
    })),
  };
}

function trans(
  labels: Record<string, string> = {},
  placeholders: Record<string, string> = {},
  option_labels: Record<string, string> = {},
): FormTranslationData {
  return { labels, placeholders, option_labels };
}

// ── getVariantOnlyFieldKeys ──────────────────────────────

describe('getVariantOnlyFieldKeys', () => {
  it('returns field keys in country but not in old General', () => {
    const oldGeneral = schema({ key: 's1', fields: [{ key: 'a' }, { key: 'b' }] });
    const country = schema({ key: 's1', fields: [{ key: 'a' }, { key: 'b' }, { key: 'c' }] });
    const result = getVariantOnlyFieldKeys(oldGeneral, country);
    expect(result).toEqual(new Set(['c']));
  });

  it('returns empty set when country has no extra fields', () => {
    const s = schema({ key: 's1', fields: [{ key: 'a' }] });
    expect(getVariantOnlyFieldKeys(s, s)).toEqual(new Set());
  });

  it('includes step keys that are country-only', () => {
    const oldGeneral = schema({ key: 's1', fields: [{ key: 'a' }] });
    const country = schema(
      { key: 's1', fields: [{ key: 'a' }] },
      { key: 's_local', fields: [{ key: 'x' }] },
    );
    const result = getVariantOnlyFieldKeys(oldGeneral, country);
    expect(result).toEqual(new Set(['x']));
  });
});

// ── cascadeSchema ────────────────────────────────────────

describe('cascadeSchema', () => {
  it('adds a new field from General to country', () => {
    const oldGen = schema({ key: 's1', fields: [{ key: 'a' }] });
    const newGen = schema({ key: 's1', fields: [{ key: 'a' }, { key: 'b' }] });
    const country = schema({ key: 's1', fields: [{ key: 'a' }] });

    const result = cascadeSchema(oldGen, newGen, country);
    const fieldKeys = result.steps[0].fields.map((f) => f.key);
    expect(fieldKeys).toEqual(['a', 'b']);
  });

  it('removes a field deleted from General', () => {
    const oldGen = schema({ key: 's1', fields: [{ key: 'a' }, { key: 'b' }] });
    const newGen = schema({ key: 's1', fields: [{ key: 'a' }] });
    const country = schema({ key: 's1', fields: [{ key: 'a' }, { key: 'b' }] });

    const result = cascadeSchema(oldGen, newGen, country);
    const fieldKeys = result.steps[0].fields.map((f) => f.key);
    expect(fieldKeys).toEqual(['a']);
  });

  it('preserves country-specific fields', () => {
    const oldGen = schema({ key: 's1', fields: [{ key: 'a' }] });
    const newGen = schema({ key: 's1', fields: [{ key: 'a' }, { key: 'b' }] });
    const country = schema({ key: 's1', fields: [{ key: 'a' }, { key: 'local_field' }] });

    const result = cascadeSchema(oldGen, newGen, country);
    const fieldKeys = result.steps[0].fields.map((f) => f.key);
    // General fields first, then country-specific appended
    expect(fieldKeys).toEqual(['a', 'b', 'local_field']);
  });

  it('preserves country-specific steps at the end', () => {
    const oldGen = schema({ key: 's1', fields: [{ key: 'a' }] });
    const newGen = schema({ key: 's1', fields: [{ key: 'a' }] });
    const country = schema(
      { key: 's1', fields: [{ key: 'a' }] },
      { key: 's_local', fields: [{ key: 'x' }] },
    );

    const result = cascadeSchema(oldGen, newGen, country);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[0].key).toBe('s1');
    expect(result.steps[1].key).toBe('s_local');
    expect(result.steps[1].fields[0].key).toBe('x');
  });

  it('adds a new step from General to country', () => {
    const oldGen = schema({ key: 's1', fields: [{ key: 'a' }] });
    const newGen = schema(
      { key: 's1', fields: [{ key: 'a' }] },
      { key: 's2', fields: [{ key: 'b' }] },
    );
    const country = schema({ key: 's1', fields: [{ key: 'a' }] });

    const result = cascadeSchema(oldGen, newGen, country);
    expect(result.steps).toHaveLength(2);
    expect(result.steps[1].key).toBe('s2');
  });

  it('removes a step deleted from General', () => {
    const oldGen = schema(
      { key: 's1', fields: [{ key: 'a' }] },
      { key: 's2', fields: [{ key: 'b' }] },
    );
    const newGen = schema({ key: 's1', fields: [{ key: 'a' }] });
    const country = schema(
      { key: 's1', fields: [{ key: 'a' }] },
      { key: 's2', fields: [{ key: 'b' }] },
    );

    const result = cascadeSchema(oldGen, newGen, country);
    expect(result.steps).toHaveLength(1);
    expect(result.steps[0].key).toBe('s1');
  });
});

// ── cascadeTranslations ──────────────────────────────────

describe('cascadeTranslations', () => {
  it('copies new translation keys from General to country', () => {
    const oldGen = { es: trans({ a: 'A' }) };
    const newGen = { es: trans({ a: 'A', b: 'B' }) };
    const country = { es: trans({ a: 'A' }) };

    const result = cascadeTranslations(oldGen, newGen, country, new Set());
    expect(result.es.labels.b).toBe('B');
  });

  it('updates inherited translation when General changes it', () => {
    const oldGen = { es: trans({ a: 'Old' }) };
    const newGen = { es: trans({ a: 'New' }) };
    const country = { es: trans({ a: 'Old' }) }; // still inherited

    const result = cascadeTranslations(oldGen, newGen, country, new Set());
    expect(result.es.labels.a).toBe('New');
  });

  it('preserves customized translation in country', () => {
    const oldGen = { es: trans({ a: 'Old' }) };
    const newGen = { es: trans({ a: 'New' }) };
    const country = { es: trans({ a: 'Custom' }) }; // customized

    const result = cascadeTranslations(oldGen, newGen, country, new Set());
    expect(result.es.labels.a).toBe('Custom');
  });

  it('removes translation for deleted field (non-country-specific)', () => {
    const oldGen = { es: trans({ a: 'A', b: 'B' }) };
    const newGen = { es: trans({ a: 'A' }) }; // b removed from General
    const country = { es: trans({ a: 'A', b: 'B' }) };

    const result = cascadeTranslations(oldGen, newGen, country, new Set());
    expect(result.es.labels.a).toBe('A');
    expect(result.es.labels.b).toBeUndefined();
  });

  it('preserves translation for country-specific field even if not in General', () => {
    const oldGen = { es: trans({ a: 'A' }) };
    const newGen = { es: trans({ a: 'A' }) };
    const country = { es: trans({ a: 'A', local: 'Local' }) };

    const result = cascadeTranslations(oldGen, newGen, country, new Set(['local']));
    expect(result.es.labels.local).toBe('Local');
  });

  it('cascades placeholders and option_labels too', () => {
    const oldGen = { es: trans({}, { a: 'ph_old' }, { 'a.opt': 'opt_old' }) };
    const newGen = { es: trans({}, { a: 'ph_new' }, { 'a.opt': 'opt_new' }) };
    const country = { es: trans({}, { a: 'ph_old' }, { 'a.opt': 'opt_old' }) };

    const result = cascadeTranslations(oldGen, newGen, country, new Set());
    expect(result.es.placeholders.a).toBe('ph_new');
    expect(result.es.option_labels['a.opt']).toBe('opt_new');
  });

  it('handles missing locale in country gracefully', () => {
    const oldGen = { es: trans({ a: 'A' }) };
    const newGen = { es: trans({ a: 'A' }), en: trans({ a: 'A_en' }) };
    const country = { es: trans({ a: 'A' }) }; // no 'en'

    const result = cascadeTranslations(oldGen, newGen, country, new Set());
    expect(result.en.labels.a).toBe('A_en');
  });
});
