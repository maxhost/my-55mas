import { describe, it, expect } from 'vitest';
import { saveSubtypesSchema, subtypeInputSchema } from '../schemas';

describe('subtypeInputSchema', () => {
  it('accepts valid subtype input', () => {
    const result = subtypeInputSchema.safeParse({
      slug: 'dog',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Perro', en: 'Dog' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts input with existing id (update)', () => {
    const result = subtypeInputSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      slug: 'cat',
      sort_order: 1,
      is_active: true,
      translations: { es: 'Gato' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty slug', () => {
    const result = subtypeInputSchema.safeParse({
      slug: '',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Perro' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase', () => {
    const result = subtypeInputSchema.safeParse({
      slug: 'Dog',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Perro' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug starting with number', () => {
    const result = subtypeInputSchema.safeParse({
      slug: '1dog',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Perro' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative sort_order', () => {
    const result = subtypeInputSchema.safeParse({
      slug: 'dog',
      sort_order: -1,
      is_active: true,
      translations: { es: 'Perro' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty translation name', () => {
    const result = subtypeInputSchema.safeParse({
      slug: 'dog',
      sort_order: 0,
      is_active: true,
      translations: { es: '' },
    });
    expect(result.success).toBe(false);
  });
});

describe('saveSubtypesSchema', () => {
  it('accepts valid save input', () => {
    const result = saveSubtypesSchema.safeParse({
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      subtypes: [
        { slug: 'dog', sort_order: 0, is_active: true, translations: { es: 'Perro' } },
        { slug: 'cat', sort_order: 1, is_active: true, translations: { es: 'Gato' } },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty subtypes array (clear all)', () => {
    const result = saveSubtypesSchema.safeParse({
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      subtypes: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid service_id', () => {
    const result = saveSubtypesSchema.safeParse({
      service_id: 'not-a-uuid',
      subtypes: [],
    });
    expect(result.success).toBe(false);
  });
});
