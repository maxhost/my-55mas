import { describe, it, expect } from 'vitest';
import { adaptSurveyQuestion, mapResponseType } from '../survey-adapter';

describe('mapResponseType', () => {
  it('maps known types', () => {
    expect(mapResponseType('text')).toBe('text');
    expect(mapResponseType('multiline_text')).toBe('multilineText');
    expect(mapResponseType('number')).toBe('number');
    expect(mapResponseType('boolean')).toBe('boolean');
    expect(mapResponseType('single_select')).toBe('singleSelect');
    expect(mapResponseType('multi_select')).toBe('multiSelect');
  });

  it('falls back to text for unknown', () => {
    expect(mapResponseType('rating')).toBe('text');
    expect(mapResponseType('')).toBe('text');
  });
});

describe('adaptSurveyQuestion', () => {
  it('adapts a text question', () => {
    const q = adaptSurveyQuestion({
      key: 'q1',
      response_type: 'text',
      i18n: { es: { label: 'Pregunta 1' } },
      options: null,
    });
    expect(q.key).toBe('q1');
    expect(q.type).toBe('text');
    expect(q.required).toBe(false);
    expect(q.i18n.es?.label).toBe('Pregunta 1');
    expect(q.options).toBeUndefined();
  });

  it('adapts a single_select with i18n options', () => {
    const q = adaptSurveyQuestion({
      key: 'q2',
      response_type: 'single_select',
      i18n: {},
      options: [
        { value: 'a', i18n: { es: { label: 'Opción A' } } },
        { value: 'b', i18n: { es: { label: 'Opción B' } } },
      ],
    });
    expect(q.type).toBe('singleSelect');
    expect(q.optionsSource).toBe('manual');
    expect(q.options).toHaveLength(2);
    expect(q.options?.[0].value).toBe('a');
  });

  it('adapts legacy options with `label` shorthand', () => {
    const q = adaptSurveyQuestion({
      key: 'q3',
      response_type: 'multi_select',
      i18n: {},
      options: [{ value: 'x', label: 'Equis' }],
    });
    expect(q.options?.[0].i18n.es?.label).toBe('Equis');
  });

  it('drops options without value', () => {
    const q = adaptSurveyQuestion({
      key: 'q4',
      response_type: 'single_select',
      i18n: {},
      options: [{ label: 'Sin value' }, { value: 'ok', label: 'OK' }],
    });
    expect(q.options).toHaveLength(1);
    expect(q.options?.[0].value).toBe('ok');
  });

  it('handles unknown response_type gracefully', () => {
    const q = adaptSurveyQuestion({
      key: 'q5',
      response_type: 'rating',
      i18n: {},
      options: null,
    });
    expect(q.type).toBe('text');
  });
});
