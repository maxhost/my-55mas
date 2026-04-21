import { describe, it, expect } from 'vitest';
import { deleteTalentFormSchema } from '../schemas';

describe('deleteTalentFormSchema', () => {
  it('accepts a valid UUID', () => {
    const result = deleteTalentFormSchema.safeParse({
      serviceId: '550e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.success).toBe(true);
  });

  it('rejects a non-UUID string', () => {
    const result = deleteTalentFormSchema.safeParse({ serviceId: 'not-a-uuid' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty string', () => {
    const result = deleteTalentFormSchema.safeParse({ serviceId: '' });
    expect(result.success).toBe(false);
  });

  it('rejects missing serviceId', () => {
    const result = deleteTalentFormSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
