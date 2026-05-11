import { describe, it, expect } from 'vitest';
import { checkEmailStatus } from '../actions/check-email-status';

describe('checkEmailStatus (smoke)', () => {
  it('rejects non-email input without touching supabase', async () => {
    const result = await checkEmailStatus({ email: 'not-an-email' });
    expect(result).toHaveProperty('error');
    expect(result).not.toHaveProperty('data');
  });

  it('rejects missing email key', async () => {
    const result = await checkEmailStatus({});
    expect(result).toHaveProperty('error');
  });

  it('rejects unknown shape', async () => {
    const result = await checkEmailStatus({ email: 123 } as unknown);
    expect(result).toHaveProperty('error');
  });
});
