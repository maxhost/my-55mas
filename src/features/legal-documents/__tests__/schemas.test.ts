import { describe, it, expect } from 'vitest';
import { saveLegalDocumentSchema } from '../schemas';

const VALID_STATE = { root: { type: 'root', children: [] } };

const BASE = {
  slug: 'terms' as const,
  expectedUpdatedAt: '2026-05-14T10:00:00.000Z',
  translations: {
    es: { lexicalState: VALID_STATE, richHtml: '<p>Hola</p>' },
  },
};

describe('saveLegalDocumentSchema', () => {
  it('accepts a valid input', () => {
    expect(saveLegalDocumentSchema.safeParse(BASE).success).toBe(true);
  });

  it('accepts all 4 legal-document slugs', () => {
    for (const slug of [
      'terms',
      'privacy',
      'terms_of_use',
      'transparency',
    ] as const) {
      expect(
        saveLegalDocumentSchema.safeParse({ ...BASE, slug }).success,
      ).toBe(true);
    }
  });

  it('rejects unknown slugs', () => {
    expect(
      saveLegalDocumentSchema.safeParse({ ...BASE, slug: 'nope' }).success,
    ).toBe(false);
  });

  it('accepts null lexicalState per locale', () => {
    expect(
      saveLegalDocumentSchema.safeParse({
        ...BASE,
        translations: { es: { lexicalState: null, richHtml: '' } },
      }).success,
    ).toBe(true);
  });

  it('rejects lexicalState without root', () => {
    expect(
      saveLegalDocumentSchema.safeParse({
        ...BASE,
        translations: {
          es: { lexicalState: { notRoot: {} }, richHtml: '' },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects richHtml over 200KB', () => {
    const huge = 'x'.repeat(200_001);
    expect(
      saveLegalDocumentSchema.safeParse({
        ...BASE,
        translations: {
          es: { lexicalState: VALID_STATE, richHtml: huge },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects unknown locale keys', () => {
    expect(
      saveLegalDocumentSchema.safeParse({
        ...BASE,
        translations: {
          xx: { lexicalState: VALID_STATE, richHtml: '<p>x</p>' },
        },
      }).success,
    ).toBe(false);
  });

  it('rejects missing expectedUpdatedAt', () => {
    const { expectedUpdatedAt: _omit, ...rest } = BASE;
    expect(saveLegalDocumentSchema.safeParse(rest).success).toBe(false);
  });
});
