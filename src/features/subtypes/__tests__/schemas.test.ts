import { describe, it, expect } from 'vitest';
import { subtypeItemInputSchema, subtypeGroupInputSchema, saveSubtypeGroupsSchema, assignGroupsSchema } from '../schemas';

describe('subtypeItemInputSchema', () => {
  it('accepts valid item input', () => {
    const result = subtypeItemInputSchema.safeParse({
      slug: 'dog',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Perro', en: 'Dog' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts input with existing id (update)', () => {
    const result = subtypeItemInputSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
      slug: 'cat',
      sort_order: 1,
      is_active: true,
      translations: { es: 'Gato' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty slug', () => {
    const result = subtypeItemInputSchema.safeParse({
      slug: '',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Perro' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase', () => {
    const result = subtypeItemInputSchema.safeParse({
      slug: 'Dog',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Perro' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug starting with number', () => {
    const result = subtypeItemInputSchema.safeParse({
      slug: '1dog',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Perro' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative sort_order', () => {
    const result = subtypeItemInputSchema.safeParse({
      slug: 'dog',
      sort_order: -1,
      is_active: true,
      translations: { es: 'Perro' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty translation name', () => {
    const result = subtypeItemInputSchema.safeParse({
      slug: 'dog',
      sort_order: 0,
      is_active: true,
      translations: { es: '' },
    });
    expect(result.success).toBe(false);
  });
});

describe('subtypeGroupInputSchema', () => {
  it('accepts valid group with items', () => {
    const result = subtypeGroupInputSchema.safeParse({
      slug: 'pet_type',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Tipo de mascota', en: 'Pet type' },
      items: [
        { slug: 'dog', sort_order: 0, is_active: true, translations: { es: 'Perro' } },
        { slug: 'cat', sort_order: 1, is_active: true, translations: { es: 'Gato' } },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts group with empty items (no items yet)', () => {
    const result = subtypeGroupInputSchema.safeParse({
      slug: 'size',
      sort_order: 0,
      is_active: true,
      translations: { es: 'Tamaño' },
      items: [],
    });
    expect(result.success).toBe(true);
  });
});

describe('saveSubtypeGroupsSchema', () => {
  it('accepts valid save input with groups', () => {
    const result = saveSubtypeGroupsSchema.safeParse({
      groups: [
        {
          slug: 'pet_type',
          sort_order: 0,
          is_active: true,
          translations: { es: 'Tipo' },
          items: [
            { slug: 'dog', sort_order: 0, is_active: true, translations: { es: 'Perro' } },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty groups array (clear all)', () => {
    const result = saveSubtypeGroupsSchema.safeParse({
      groups: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects when groups is missing', () => {
    const result = saveSubtypeGroupsSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe('assignGroupsSchema', () => {
  it('accepts valid assignment input', () => {
    const result = assignGroupsSchema.safeParse({
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      group_ids: [
        { group_id: '660e8400-e29b-41d4-a716-446655440000', sort_order: 0 },
        { group_id: '770e8400-e29b-41d4-a716-446655440000', sort_order: 1 },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty group_ids (unassign all)', () => {
    const result = assignGroupsSchema.safeParse({
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      group_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid service_id', () => {
    const result = assignGroupsSchema.safeParse({
      service_id: 'not-a-uuid',
      group_ids: [],
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid group_id', () => {
    const result = assignGroupsSchema.safeParse({
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      group_ids: [{ group_id: 'bad', sort_order: 0 }],
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative sort_order', () => {
    const result = assignGroupsSchema.safeParse({
      service_id: '550e8400-e29b-41d4-a716-446655440000',
      group_ids: [{ group_id: '660e8400-e29b-41d4-a716-446655440000', sort_order: -1 }],
    });
    expect(result.success).toBe(false);
  });
});
