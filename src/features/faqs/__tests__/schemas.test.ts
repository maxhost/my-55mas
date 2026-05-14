import { describe, it, expect } from 'vitest';
import { saveFaqSchema } from '../schemas';

const BASE = {
  faq: {
    sort_order: 0,
    is_active: true,
    translations: {
      es: { question: '¿Cómo funciona?', answer: 'Funciona bien.' },
    },
  },
};

describe('saveFaqSchema', () => {
  it('accepts a valid FAQ with ES translation', () => {
    expect(saveFaqSchema.safeParse(BASE).success).toBe(true);
  });

  it('accepts multiple locale translations', () => {
    const result = saveFaqSchema.safeParse({
      faq: {
        ...BASE.faq,
        translations: {
          es: { question: 'P', answer: 'R' },
          en: { question: 'Q', answer: 'A' },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty translations', () => {
    expect(
      saveFaqSchema.safeParse({
        faq: { ...BASE.faq, translations: {} },
      }).success,
    ).toBe(false);
  });

  it('rejects translations without ES', () => {
    expect(
      saveFaqSchema.safeParse({
        faq: {
          ...BASE.faq,
          translations: { en: { question: 'Q', answer: 'A' } },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects empty question or answer in a translation', () => {
    expect(
      saveFaqSchema.safeParse({
        faq: {
          ...BASE.faq,
          translations: { es: { question: '', answer: 'R' } },
        },
      }).success,
    ).toBe(false);
    expect(
      saveFaqSchema.safeParse({
        faq: {
          ...BASE.faq,
          translations: { es: { question: 'P', answer: '' } },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects unknown locale keys', () => {
    expect(
      saveFaqSchema.safeParse({
        faq: {
          ...BASE.faq,
          translations: {
            es: { question: 'P', answer: 'R' },
            xx: { question: 'Q', answer: 'A' },
          },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects negative sort_order', () => {
    expect(
      saveFaqSchema.safeParse({
        faq: { ...BASE.faq, sort_order: -1 },
      }).success,
    ).toBe(false);
  });
});
