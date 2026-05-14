import { describe, it, expect } from 'vitest';
import { saveConfigSchema } from '../schemas';

const BASE = {
  service_id: '00000000-0000-0000-0000-000000000001',
  countries: [],
  cities: [],
};

describe('saveConfigSchema — category', () => {
  it('accepts each of the 4 valid categories', () => {
    for (const c of ['accompaniment', 'classes', 'repairs', 'home'] as const) {
      const result = saveConfigSchema.safeParse({ ...BASE, category: c });
      expect(result.success).toBe(true);
    }
  });

  it('accepts null (uncategorized)', () => {
    const result = saveConfigSchema.safeParse({ ...BASE, category: null });
    expect(result.success).toBe(true);
  });

  it('accepts omitted category (optional)', () => {
    const result = saveConfigSchema.safeParse(BASE);
    expect(result.success).toBe(true);
  });

  it('rejects unknown category strings', () => {
    const result = saveConfigSchema.safeParse({ ...BASE, category: 'random' });
    expect(result.success).toBe(false);
  });
});
