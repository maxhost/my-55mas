import { describe, it, expect } from 'vitest';
import {
  saveRegistrationFormSchema,
  createRegistrationFormSchema,
  saveRegistrationConfigSchema,
  deleteRegistrationFormSchema,
} from '../schemas';

describe('createRegistrationFormSchema', () => {
  it('accepts valid name + slug', () => {
    const result = createRegistrationFormSchema.safeParse({
      name: 'Talentos Premium',
      slug: 'talentos-premium',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty name', () => {
    const result = createRegistrationFormSchema.safeParse({ name: '', slug: 'test' });
    expect(result.success).toBe(false);
  });

  it('rejects name over 100 chars', () => {
    const result = createRegistrationFormSchema.safeParse({
      name: 'a'.repeat(101),
      slug: 'test',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with uppercase', () => {
    const result = createRegistrationFormSchema.safeParse({
      name: 'Test',
      slug: 'Bad-Slug',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with underscores', () => {
    const result = createRegistrationFormSchema.safeParse({
      name: 'Test',
      slug: 'bad_slug',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug starting with hyphen', () => {
    const result = createRegistrationFormSchema.safeParse({
      name: 'Test',
      slug: '-bad-slug',
    });
    expect(result.success).toBe(false);
  });

  it('accepts single-word slug', () => {
    const result = createRegistrationFormSchema.safeParse({
      name: 'Premium',
      slug: 'premium',
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing slug', () => {
    const result = createRegistrationFormSchema.safeParse({ name: 'Test' });
    expect(result.success).toBe(false);
  });
});

describe('saveRegistrationFormSchema', () => {
  const validInput = {
    slug: 'talentos-premium',
    city_id: null,
    schema: { steps: [{ key: 'step_1', fields: [{ key: 'f1', type: 'text', required: false }] }] },
    locale: 'es',
    labels: {},
    placeholders: {},
    option_labels: {},
  };

  it('accepts valid save input', () => {
    const result = saveRegistrationFormSchema.safeParse(validInput);
    expect(result.success).toBe(true);
  });

  it('accepts with city_id uuid', () => {
    const result = saveRegistrationFormSchema.safeParse({
      ...validInput,
      city_id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid slug', () => {
    const result = saveRegistrationFormSchema.safeParse({
      ...validInput,
      slug: 'Bad Slug',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with underscores', () => {
    const result = saveRegistrationFormSchema.safeParse({
      ...validInput,
      slug: 'bad_slug',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty schema steps', () => {
    const result = saveRegistrationFormSchema.safeParse({
      ...validInput,
      schema: { steps: [] },
    });
    expect(result.success).toBe(false);
  });
});

describe('saveRegistrationConfigSchema', () => {
  it('accepts valid config', () => {
    const result = saveRegistrationConfigSchema.safeParse({
      form_id: '550e8400-e29b-41d4-a716-446655440000',
      country_ids: ['550e8400-e29b-41d4-a716-446655440001'],
      city_ids: ['550e8400-e29b-41d4-a716-446655440002'],
    });
    expect(result.success).toBe(true);
  });

  it('accepts empty arrays (clear all)', () => {
    const result = saveRegistrationConfigSchema.safeParse({
      form_id: '550e8400-e29b-41d4-a716-446655440000',
      country_ids: [],
      city_ids: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid form_id', () => {
    const result = saveRegistrationConfigSchema.safeParse({
      form_id: 'not-a-uuid',
      country_ids: [],
      city_ids: [],
    });
    expect(result.success).toBe(false);
  });
});

describe('deleteRegistrationFormSchema', () => {
  it('accepts a valid UUID', () => {
    const result = deleteRegistrationFormSchema.safeParse({
      id: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    const result = deleteRegistrationFormSchema.safeParse({ id: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = deleteRegistrationFormSchema.safeParse({ id: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing id', () => {
    const result = deleteRegistrationFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
