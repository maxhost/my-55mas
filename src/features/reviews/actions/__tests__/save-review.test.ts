import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSingle = vi.fn();
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn();
const mockInsert = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      update: (payload: unknown) => {
        mockUpdate(payload);
        return { eq: mockEq };
      },
      insert: (payload: unknown) => {
        mockInsert(payload);
        return { select: mockSelect };
      },
    }),
  }),
}));

const mockRevalidate = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidate(...args),
}));

import { saveReview } from '../save-review';

const BASE_REVIEW = {
  author_name: 'María',
  author_photo: null,
  stars: 4.5,
  sort_order: 0,
  is_active: true,
  translations: { es: 'Excelente' },
};

describe('saveReview', () => {
  beforeEach(() => {
    mockUpdate.mockReset();
    mockInsert.mockReset();
    mockEq.mockReset();
    mockSelect.mockReset();
    mockSingle.mockReset();
    mockRevalidate.mockReset();
    mockEq.mockResolvedValue({ error: null });
    mockSelect.mockReturnValue({ single: mockSingle });
    mockSingle.mockResolvedValue({
      data: { id: '00000000-0000-0000-0000-000000000099' },
      error: null,
    });
  });

  it('rejects invalid stars before touching DB', async () => {
    const result = await saveReview({
      review: { ...BASE_REVIEW, stars: 0.3 },
    });
    expect(result).toHaveProperty('error');
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('inserts a new review when id is missing', async () => {
    const result = await saveReview({ review: BASE_REVIEW });
    expect(result).toEqual({
      data: { id: '00000000-0000-0000-0000-000000000099' },
    });
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockUpdate).not.toHaveBeenCalled();
    const payload = mockInsert.mock.calls[0][0];
    expect(payload.author_name).toBe('María');
    expect(payload.stars).toBe(4.5);
    expect(payload.i18n).toEqual({ es: { text: 'Excelente' } });
    expect(mockRevalidate).toHaveBeenCalledOnce();
  });

  it('updates an existing review when id is present', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    const result = await saveReview({
      review: { ...BASE_REVIEW, id },
    });
    expect(result).toEqual({ data: { id } });
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('builds i18n with only locales that have translations', async () => {
    await saveReview({
      review: {
        ...BASE_REVIEW,
        translations: { es: 'A', en: 'B' },
      },
    });
    const payload = mockInsert.mock.calls[0][0];
    expect(payload.i18n).toEqual({
      es: { text: 'A' },
      en: { text: 'B' },
    });
  });

  it('returns db error when insert fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'boom' },
    });
    const result = await saveReview({ review: BASE_REVIEW });
    expect(result).toEqual({ error: { _db: ['boom'] } });
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});
