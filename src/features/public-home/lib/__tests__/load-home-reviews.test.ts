import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const mockOrder2 = vi.fn();
const mockOrder1 = vi.fn(() => ({ order: mockOrder2 }));
const mockEq = vi.fn(() => ({ order: mockOrder1 }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ from: () => ({ select: mockSelect }) }),
}));

import { loadHomeReviews } from '../load-home-reviews';

beforeEach(() => {
  mockOrder2.mockReset();
  mockOrder1.mockClear();
  mockEq.mockClear();
  mockSelect.mockClear();
  // buildReviewPhotoPublicUrl lee process.env directo; necesario fijar
  // la URL antes de que el loader corra.
  vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'https://test.supabase.co');
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('loadHomeReviews', () => {
  it('happy path: loads two active reviews localized to target locale', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        {
          id: 'r1',
          author_name: 'Andrea',
          author_photo: null,
          stars: '5.0',
          sort_order: 0,
          i18n: { en: { text: 'Great service' } },
          created_at: '2026-05-01T00:00:00Z',
        },
        {
          id: 'r2',
          author_name: 'Monica',
          author_photo: null,
          stars: '4.5',
          sort_order: 1,
          i18n: { en: { text: 'Wonderful' } },
          created_at: '2026-05-02T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await loadHomeReviews('en');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'r1',
      authorName: 'Andrea',
      photoUrl: null,
      rating: 5,
      quote: 'Great service',
    });
    expect(result[1].quote).toBe('Wonderful');
    expect(mockSelect).toHaveBeenCalledWith(
      'id, author_name, author_photo, stars, sort_order, i18n, created_at',
    );
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
    expect(mockOrder1).toHaveBeenCalledWith('sort_order', { ascending: true });
    expect(mockOrder2).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('falls back to ES when target locale has no text', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        {
          id: 'r1',
          author_name: 'Pedro',
          author_photo: null,
          stars: '4',
          sort_order: 0,
          i18n: { es: { text: 'Servicio excelente' } },
          created_at: '2026-05-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await loadHomeReviews('en');

    expect(result).toHaveLength(1);
    expect(result[0].quote).toBe('Servicio excelente');
  });

  it('skips reviews with no text in any locale', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        {
          id: 'r1',
          author_name: 'No text',
          author_photo: null,
          stars: '5',
          sort_order: 0,
          i18n: {},
          created_at: '2026-05-01T00:00:00Z',
        },
        {
          id: 'r2',
          author_name: 'Has text',
          author_photo: null,
          stars: '5',
          sort_order: 1,
          i18n: { es: { text: 'Bueno' } },
          created_at: '2026-05-02T00:00:00Z',
        },
        {
          id: 'r3',
          author_name: 'Whitespace only',
          author_photo: null,
          stars: '5',
          sort_order: 2,
          i18n: { es: { text: '   \n   ' } },
          created_at: '2026-05-03T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await loadHomeReviews('es');

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('r2');
  });

  it('builds the photo URL when author_photo is set', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        {
          id: 'r1',
          author_name: 'WithPhoto',
          author_photo: 'reviews/123/avatar',
          stars: '5',
          sort_order: 0,
          i18n: { es: { text: 'Hola' } },
          created_at: '2026-05-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await loadHomeReviews('es');

    expect(result[0].photoUrl).toBe(
      'https://test.supabase.co/storage/v1/object/public/review-photos/reviews/123/avatar.webp',
    );
  });

  it('returns null photoUrl when author_photo is null', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        {
          id: 'r1',
          author_name: 'NoPhoto',
          author_photo: null,
          stars: '5',
          sort_order: 0,
          i18n: { es: { text: 'Hi' } },
          created_at: '2026-05-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await loadHomeReviews('es');
    expect(result[0].photoUrl).toBeNull();
  });

  it('coerces stars from string to number', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        {
          id: 'r1',
          author_name: 'Half',
          author_photo: null,
          stars: '4.5',
          sort_order: 0,
          i18n: { es: { text: 'x' } },
          created_at: '2026-05-01T00:00:00Z',
        },
      ],
      error: null,
    });

    const result = await loadHomeReviews('es');
    expect(result[0].rating).toBe(4.5);
    expect(typeof result[0].rating).toBe('number');
  });

  it('returns [] (no throw) when supabase reports an error', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: null,
      error: { message: 'boom' },
    });

    const result = await loadHomeReviews('es');
    expect(result).toEqual([]);
  });

  it('returns [] (no throw) when the supabase call itself throws', async () => {
    mockOrder2.mockRejectedValueOnce(new Error('network down'));

    const result = await loadHomeReviews('es');
    expect(result).toEqual([]);
  });
});
