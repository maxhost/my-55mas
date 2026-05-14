import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSingle = vi.fn();
const mockEq = vi.fn(() => ({ single: mockSingle }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ from: () => ({ select: mockSelect }) }),
}));

import { loadPublicLegalDocument } from '../load-public-legal-document';

beforeEach(() => {
  mockSingle.mockReset();
  mockEq.mockClear();
  mockSelect.mockClear();
});

describe('loadPublicLegalDocument', () => {
  it('happy path: returns richHtml + updatedAt for target locale', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        updated_at: '2026-05-10T12:00:00Z',
        i18n: { en: { richHtml: '<p>Terms in English</p>' } },
      },
      error: null,
    });

    const result = await loadPublicLegalDocument('terms', 'en');

    expect(result).toEqual({
      richHtml: '<p>Terms in English</p>',
      updatedAt: '2026-05-10T12:00:00Z',
    });
    expect(mockSelect).toHaveBeenCalledWith('updated_at, i18n');
    expect(mockEq).toHaveBeenCalledWith('slug', 'terms');
  });

  it('falls back to ES when target locale has no richHtml', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        updated_at: '2026-05-10T12:00:00Z',
        i18n: { es: { richHtml: '<p>Términos en español</p>' } },
      },
      error: null,
    });

    const result = await loadPublicLegalDocument('terms', 'pt');

    expect(result?.richHtml).toBe('<p>Términos en español</p>');
  });

  it('returns null when richHtml is empty in all locales', async () => {
    mockSingle.mockResolvedValueOnce({
      data: {
        updated_at: '2026-05-10T12:00:00Z',
        i18n: { es: { richHtml: '   ' } },
      },
      error: null,
    });

    const result = await loadPublicLegalDocument('terms', 'es');
    expect(result).toBeNull();
  });

  it('returns null when supabase reports an error', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'no rows' },
    });

    const result = await loadPublicLegalDocument('terms', 'es');
    expect(result).toBeNull();
  });

  it('returns null when the supabase call itself throws', async () => {
    mockSingle.mockRejectedValueOnce(new Error('network'));

    const result = await loadPublicLegalDocument('terms', 'es');
    expect(result).toBeNull();
  });

  it('returns null when data is missing', async () => {
    mockSingle.mockResolvedValueOnce({ data: null, error: null });

    const result = await loadPublicLegalDocument('terms', 'es');
    expect(result).toBeNull();
  });
});
