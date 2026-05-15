import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockEq = vi.fn();
const mockSelect = vi.fn(() => ({ eq: mockEq }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ from: () => ({ select: mockSelect }) }),
}));

import { listActiveCities } from '../list-active-cities';

beforeEach(() => {
  mockEq.mockReset();
  mockSelect.mockClear();
});

describe('listActiveCities', () => {
  it('localizes name to target locale, maps country_id, sorts alpha', async () => {
    mockEq.mockResolvedValueOnce({
      data: [
        {
          id: 'c2',
          country_id: 'es',
          slug: 'madrid',
          i18n: { en: { name: 'Madrid' } },
        },
        {
          id: 'c1',
          country_id: 'es',
          slug: 'barcelona',
          i18n: { en: { name: 'Barcelona' } },
        },
      ],
      error: null,
    });

    const out = await listActiveCities('en');

    expect(out).toEqual([
      { id: 'c1', countryId: 'es', name: 'Barcelona' },
      { id: 'c2', countryId: 'es', name: 'Madrid' },
    ]);
    expect(mockSelect).toHaveBeenCalledWith('id, country_id, slug, i18n');
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
  });

  it('falls back to ES name when target locale missing', async () => {
    mockEq.mockResolvedValueOnce({
      data: [
        {
          id: 'c1',
          country_id: 'es',
          slug: 'barcelona',
          i18n: { es: { name: 'Barcelona ES' } },
        },
      ],
      error: null,
    });

    const out = await listActiveCities('fr');
    expect(out[0].name).toBe('Barcelona ES');
  });

  it('falls back to slug when no i18n name at all', async () => {
    mockEq.mockResolvedValueOnce({
      data: [{ id: 'c1', country_id: 'es', slug: 'barcelona', i18n: {} }],
      error: null,
    });

    const out = await listActiveCities('es');
    expect(out[0].name).toBe('barcelona');
  });

  it('throws when supabase errors', async () => {
    mockEq.mockResolvedValueOnce({ data: null, error: { message: 'boom' } });
    await expect(listActiveCities('es')).rejects.toBeTruthy();
  });

  it('returns [] when no rows', async () => {
    mockEq.mockResolvedValueOnce({ data: null, error: null });
    expect(await listActiveCities('es')).toEqual([]);
  });
});
