import { describe, it, expect } from 'vitest';
import { surveyQuestionInputSchema, saveSurveyQuestionsSchema } from '../schemas';

describe('surveyQuestionInputSchema', () => {
  it('accepts valid text question', () => {
    const result = surveyQuestionInputSchema.safeParse({
      key: 'how_found',
      response_type: 'text',
      options: null,
      sort_order: 0,
      is_active: true,
      translations: { es: { label: '¿Cómo nos encontraste?' } },
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid scale_1_5 question', () => {
    const result = surveyQuestionInputSchema.safeParse({
      key: 'ease_finding_job',
      response_type: 'scale_1_5',
      options: null,
      sort_order: 1,
      is_active: true,
      translations: { es: { label: 'Del 1 al 5...' } },
    });
    expect(result.success).toBe(true);
  });

  it('accepts valid single_select with options', () => {
    const result = surveyQuestionInputSchema.safeParse({
      key: 'referral_source',
      response_type: 'single_select',
      options: ['google', 'facebook', 'friend'],
      sort_order: 2,
      is_active: true,
      translations: {
        es: {
          label: 'Fuente',
          option_labels: { google: 'Google', facebook: 'Facebook', friend: 'Amigo' },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it('accepts yes_no question', () => {
    const result = surveyQuestionInputSchema.safeParse({
      key: 'would_recommend',
      response_type: 'yes_no',
      options: null,
      sort_order: 3,
      is_active: true,
      translations: { es: { label: '¿Nos recomendarías?' } },
    });
    expect(result.success).toBe(true);
  });

  it('accepts question with id (update)', () => {
    const result = surveyQuestionInputSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      key: 'how_found',
      response_type: 'text',
      options: null,
      sort_order: 0,
      is_active: true,
      translations: { es: { label: 'Test' } },
    });
    expect(result.success).toBe(true);
  });

  it('rejects single_select without options', () => {
    const result = surveyQuestionInputSchema.safeParse({
      key: 'bad_select',
      response_type: 'single_select',
      options: null,
      sort_order: 0,
      is_active: true,
      translations: { es: { label: 'Test' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects single_select with empty options array', () => {
    const result = surveyQuestionInputSchema.safeParse({
      key: 'bad_select',
      response_type: 'single_select',
      options: [],
      sort_order: 0,
      is_active: true,
      translations: { es: { label: 'Test' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid key format', () => {
    const result = surveyQuestionInputSchema.safeParse({
      key: 'Bad Key',
      response_type: 'text',
      options: null,
      sort_order: 0,
      is_active: true,
      translations: { es: { label: 'Test' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty label', () => {
    const result = surveyQuestionInputSchema.safeParse({
      key: 'test',
      response_type: 'text',
      options: null,
      sort_order: 0,
      is_active: true,
      translations: { es: { label: '' } },
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid response_type', () => {
    const result = surveyQuestionInputSchema.safeParse({
      key: 'test',
      response_type: 'invalid_type',
      options: null,
      sort_order: 0,
      is_active: true,
      translations: { es: { label: 'Test' } },
    });
    expect(result.success).toBe(false);
  });
});

describe('saveSurveyQuestionsSchema', () => {
  it('accepts valid save input', () => {
    const result = saveSurveyQuestionsSchema.safeParse({
      questions: [
        {
          key: 'q1',
          response_type: 'text',
          options: null,
          sort_order: 0,
          is_active: true,
          translations: { es: { label: 'Pregunta 1' } },
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty questions array (clear all)', () => {
    const result = saveSurveyQuestionsSchema.safeParse({ questions: [] });
    expect(result.success).toBe(true);
  });
});
