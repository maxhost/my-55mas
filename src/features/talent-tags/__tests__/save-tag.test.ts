import { describe, it, expect } from 'vitest';
import { saveTag } from '../actions/save-tag';

describe('saveTag (smoke)', () => {
  it('returns a validation error for an invalid input without touching supabase', async () => {
    const result = await saveTag({
      tag: {
        slug: '',
        sort_order: 0,
        is_active: true,
        translations: {},
      },
    } as unknown as Parameters<typeof saveTag>[0]);

    expect(result).toHaveProperty('error');
    expect(result).not.toHaveProperty('data');
  });

  it('returns a validation error when tag is missing', async () => {
    const result = await saveTag({} as unknown as Parameters<typeof saveTag>[0]);
    expect(result).toHaveProperty('error');
  });
});
