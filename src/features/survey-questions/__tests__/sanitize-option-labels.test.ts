import { describe, it, expect } from 'vitest';
import { sanitizeSurveyOptionLabels } from '../sanitize-option-labels';
import type { SurveyQuestionInput } from '../types';

function question(overrides: Partial<SurveyQuestionInput> = {}): SurveyQuestionInput {
  return {
    key: 'q1',
    response_type: 'single_select',
    options: ['opt1', 'opt2'],
    sort_order: 0,
    is_active: true,
    translations: {},
    ...overrides,
  };
}

describe('sanitizeSurveyOptionLabels', () => {
  it('removes option_labels of deleted option', () => {
    const q = question({
      options: ['opt1'],
      translations: {
        es: { label: 'Pregunta', option_labels: { opt1: 'Opción 1', opt2: 'Ghost' } },
      },
    });

    const result = sanitizeSurveyOptionLabels(q);
    expect(result.translations.es.option_labels).toEqual({ opt1: 'Opción 1' });
  });

  it('preserves option_labels of existing options', () => {
    const q = question({
      options: ['opt1', 'opt2'],
      translations: {
        es: { label: 'P', option_labels: { opt1: 'A', opt2: 'B' } },
      },
    });

    const result = sanitizeSurveyOptionLabels(q);
    expect(result.translations.es.option_labels).toEqual({ opt1: 'A', opt2: 'B' });
  });

  it('works with multiple locales', () => {
    const q = question({
      options: ['opt1'],
      translations: {
        es: { label: 'P', option_labels: { opt1: 'A', orphan: 'X' } },
        en: { label: 'Q', option_labels: { opt1: 'A', orphan: 'Y' } },
      },
    });

    const result = sanitizeSurveyOptionLabels(q);
    expect(result.translations.es.option_labels).toEqual({ opt1: 'A' });
    expect(result.translations.en.option_labels).toEqual({ opt1: 'A' });
  });

  it('clears all option_labels when no options', () => {
    const q = question({
      options: null,
      translations: {
        es: { label: 'P', option_labels: { orphan: 'Ghost' } },
      },
    });

    const result = sanitizeSurveyOptionLabels(q);
    expect(result.translations.es.option_labels).toBeUndefined();
  });

  it('clears option_labels when options is empty array', () => {
    const q = question({
      options: [],
      translations: {
        es: { label: 'P', option_labels: { orphan: 'Ghost' } },
      },
    });

    const result = sanitizeSurveyOptionLabels(q);
    expect(result.translations.es.option_labels).toBeUndefined();
  });

  it('is idempotent — no change if no orphans', () => {
    const q = question({
      options: ['opt1'],
      translations: {
        es: { label: 'P', option_labels: { opt1: 'A' } },
      },
    });

    const result = sanitizeSurveyOptionLabels(q);
    expect(result.translations).toEqual(q.translations);
  });

  it('handles question without translations', () => {
    const q = question({ translations: {} });

    const result = sanitizeSurveyOptionLabels(q);
    expect(result.translations).toEqual({});
  });

  it('preserves label and description when cleaning option_labels', () => {
    const q = question({
      options: ['opt1'],
      translations: {
        es: { label: 'Mi pregunta', description: 'Descripción', option_labels: { opt1: 'A', orphan: 'X' } },
      },
    });

    const result = sanitizeSurveyOptionLabels(q);
    expect(result.translations.es.label).toBe('Mi pregunta');
    expect(result.translations.es.description).toBe('Descripción');
    expect(result.translations.es.option_labels).toEqual({ opt1: 'A' });
  });
});
