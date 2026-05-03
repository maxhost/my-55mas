import { describe, it, expect } from 'vitest';
import {
  resolveOptions,
  resolveQuestionLabels,
  isAnswerMissing,
} from '../lib/resolve-options';
import type { AssignedSubtypeGroup, Question } from '../types';

const groups: AssignedSubtypeGroup[] = [
  {
    id: 'g1',
    slug: 'tipo-bricolaje',
    translations: { es: 'Tipo de bricolaje', en: 'DIY type' },
    items: [
      { id: 'i1', slug: 'electricidad', translations: { es: 'Electricidad', en: 'Electricity' } },
      { id: 'i2', slug: 'carpinteria', translations: { es: 'Carpintería', en: 'Carpentry' } },
      { id: 'i3', slug: 'pintura', translations: { es: 'Pintura' } },
    ],
  },
];

describe('resolveOptions — manual', () => {
  it('maps manual options with locale label', () => {
    const q: Question = {
      key: 'tipo',
      type: 'singleSelect',
      required: true,
      i18n: {},
      optionsSource: 'manual',
      options: [
        { value: 'a', i18n: { es: { label: 'Aaa' }, en: { label: 'Aen' } } },
        { value: 'b', i18n: { es: { label: 'Bbb' } } },
      ],
    };
    const r = resolveOptions(q, 'en', 'es', []);
    expect(r).toEqual([
      { value: 'a', label: 'Aen' },
      { value: 'b', label: 'Bbb' }, // fallback to es
    ]);
  });

  it('falls back to value when no label in any locale', () => {
    const q: Question = {
      key: 'tipo',
      type: 'singleSelect',
      required: false,
      i18n: {},
      optionsSource: 'manual',
      options: [{ value: 'x', i18n: {} }],
    };
    expect(resolveOptions(q, 'en', 'es', [])).toEqual([{ value: 'x', label: 'x' }]);
  });
});

describe('resolveOptions — subtype', () => {
  it('returns all items of the group when no exclusions', () => {
    const q: Question = {
      key: 'tipo',
      type: 'multiSelect',
      required: true,
      i18n: {},
      optionsSource: 'subtype',
      subtypeGroupSlug: 'tipo-bricolaje',
      subtypeExcludedIds: [],
    };
    const r = resolveOptions(q, 'en', 'es', groups);
    expect(r.map((o) => o.value)).toEqual(['i1', 'i2', 'i3']);
    expect(r[0].label).toBe('Electricity');
    expect(r[2].label).toBe('Pintura'); // pintura has no en, fallback to es
  });

  it('excludes the listed ids', () => {
    const q: Question = {
      key: 'tipo',
      type: 'multiSelect',
      required: true,
      i18n: {},
      optionsSource: 'subtype',
      subtypeGroupSlug: 'tipo-bricolaje',
      subtypeExcludedIds: ['i2'],
    };
    expect(resolveOptions(q, 'es', 'es', groups).map((o) => o.value)).toEqual(['i1', 'i3']);
  });

  it('returns empty when group not found', () => {
    const q: Question = {
      key: 'tipo',
      type: 'singleSelect',
      required: true,
      i18n: {},
      optionsSource: 'subtype',
      subtypeGroupSlug: 'no-existe',
    };
    expect(resolveOptions(q, 'es', 'es', groups)).toEqual([]);
  });
});

describe('resolveQuestionLabels', () => {
  it('returns locale labels with fallback', () => {
    const q: Question = {
      key: 'tipo',
      type: 'text',
      required: false,
      i18n: { es: { label: 'Tipo', placeholder: 'Escribí', help: 'Pista' } },
    };
    expect(resolveQuestionLabels(q, 'en', 'es')).toEqual({
      label: 'Tipo',
      placeholder: 'Escribí',
      help: 'Pista',
    });
  });

  it('uses key as fallback when no labels at all', () => {
    const q: Question = { key: 'tipo', type: 'text', required: false, i18n: {} };
    expect(resolveQuestionLabels(q, 'en', 'es').label).toBe('tipo');
  });
});

describe('isAnswerMissing', () => {
  const required = (type: Question['type']): Question => ({
    key: 'k',
    type,
    required: true,
    i18n: {},
    ...(type === 'singleSelect' || type === 'multiSelect'
      ? { optionsSource: 'manual', options: [] }
      : {}),
    ...(type === 'file' ? { fileConfig: { allowedTypes: ['image/*'], maxSizeMb: 10 } } : {}),
  });

  it('skips check for non-required', () => {
    const q: Question = { key: 'k', type: 'text', required: false, i18n: {} };
    expect(isAnswerMissing(q, '')).toBe(false);
  });

  it('text: missing when empty/whitespace', () => {
    expect(isAnswerMissing(required('text'), '')).toBe(true);
    expect(isAnswerMissing(required('text'), '  ')).toBe(true);
    expect(isAnswerMissing(required('text'), 'ok')).toBe(false);
  });

  it('number: missing when null/NaN', () => {
    expect(isAnswerMissing(required('number'), null)).toBe(true);
    expect(isAnswerMissing(required('number'), Number.NaN)).toBe(true);
    expect(isAnswerMissing(required('number'), 0)).toBe(false);
  });

  it('boolean: false counts as answered', () => {
    expect(isAnswerMissing(required('boolean'), undefined)).toBe(true);
    expect(isAnswerMissing(required('boolean'), false)).toBe(false);
  });

  it('multiSelect: missing when empty array', () => {
    expect(isAnswerMissing(required('multiSelect'), [])).toBe(true);
    expect(isAnswerMissing(required('multiSelect'), ['a'])).toBe(false);
  });

  it('file: missing when empty array', () => {
    expect(isAnswerMissing(required('file'), [])).toBe(true);
    expect(isAnswerMissing(required('file'), [new File([''], 'a.jpg', { type: 'image/jpeg' })])).toBe(false);
  });
});
