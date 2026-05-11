import { describe, it, expect } from 'vitest';
import { saveGuestContact } from '../actions/save-guest-contact';

describe('saveGuestContact (smoke)', () => {
  it('rejects empty object without touching supabase', async () => {
    const result = await saveGuestContact({});
    expect(result).toHaveProperty('error');
  });

  it('rejects invalid email', async () => {
    const result = await saveGuestContact({
      full_name: 'Test',
      email: 'not-email',
      phone: '+34 600 000 000',
      fiscal_id_type_id: '00000000-0000-0000-0000-000000000001',
      fiscal_id: 'X',
    });
    expect(result).toHaveProperty('error');
  });

  it('rejects non-uuid fiscal_id_type_id', async () => {
    const result = await saveGuestContact({
      full_name: 'Test',
      email: 'a@b.com',
      phone: '123',
      fiscal_id_type_id: 'not-uuid',
      fiscal_id: 'X',
    });
    expect(result).toHaveProperty('error');
  });
});
