import { describe, it, expect } from 'vitest';
import { talentTagInputSchema, saveTalentTagSchema } from '../schemas';

describe('talentTagInputSchema', () => {
  it('accepts input without id (create) with at least one translation', () => {
    const result = talentTagInputSchema.safeParse({
      slug: 'email-enviado',
      sort_order: 10,
      is_active: true,
      translations: { es: 'Email Enviado', en: 'Email Sent' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts input with existing id (update)', () => {
    const result = talentTagInputSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      slug: 'sem-resposta',
      sort_order: 20,
      is_active: false,
      translations: { pt: 'Sem Resposta' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty slug', () => {
    const result = talentTagInputSchema.safeParse({
      slug: '',
      sort_order: 0,
      is_active: true,
      translations: { es: 'X' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase', () => {
    const result = talentTagInputSchema.safeParse({
      slug: 'Email-Enviado',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Email' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug starting with a number', () => {
    const result = talentTagInputSchema.safeParse({
      slug: '1-email',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Email' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative sort_order', () => {
    const result = talentTagInputSchema.safeParse({
      slug: 'email-enviado',
      sort_order: -5,
      is_active: true,
      translations: { es: 'Email' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty translations object (needs at least one)', () => {
    const result = talentTagInputSchema.safeParse({
      slug: 'email-enviado',
      sort_order: 0,
      is_active: true,
      translations: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects translation with empty name', () => {
    const result = talentTagInputSchema.safeParse({
      slug: 'email-enviado',
      sort_order: 0,
      is_active: true,
      translations: { es: '' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects unknown locale key', () => {
    const result = talentTagInputSchema.safeParse({
      slug: 'email-enviado',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Email', zz: 'Unknown' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts all 5 supported locales', () => {
    const result = talentTagInputSchema.safeParse({
      slug: 'email-enviado',
      sort_order: 0,
      is_active: true,
      translations: { es: 'a', en: 'b', pt: 'c', fr: 'd', ca: 'e' },
    });
    expect(result.success).toBe(true);
  });
});

describe('saveTalentTagSchema', () => {
  it('accepts wrapped save input', () => {
    const result = saveTalentTagSchema.safeParse({
      tag: {
        slug: 'email-enviado',
        sort_order: 0,
        is_active: true,
        translations: { es: 'Email' },
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing tag', () => {
    const result = saveTalentTagSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
