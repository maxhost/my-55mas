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

import { saveFaq } from '../save-faq';

const BASE_FAQ = {
  sort_order: 0,
  is_active: true,
  translations: {
    es: { question: '¿Cómo?', answer: 'Así.' },
  },
};

describe('saveFaq', () => {
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

  it('inserts a new FAQ when id is missing', async () => {
    const result = await saveFaq({ faq: BASE_FAQ });
    expect(result).toEqual({
      data: { id: '00000000-0000-0000-0000-000000000099' },
    });
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockUpdate).not.toHaveBeenCalled();
    const payload = mockInsert.mock.calls[0][0];
    expect(payload.i18n).toEqual({
      es: { question: '¿Cómo?', answer: 'Así.' },
    });
    expect(mockRevalidate).toHaveBeenCalledOnce();
  });

  it('updates when id is present', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    const result = await saveFaq({ faq: { ...BASE_FAQ, id } });
    expect(result).toEqual({ data: { id } });
    expect(mockUpdate).toHaveBeenCalledOnce();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('rejects FAQ missing ES translation', async () => {
    const result = await saveFaq({
      faq: {
        ...BASE_FAQ,
        translations: { en: { question: 'Q', answer: 'A' } },
      },
    });
    expect(result).toHaveProperty('error');
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('returns db error when insert fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'boom' },
    });
    const result = await saveFaq({ faq: BASE_FAQ });
    expect(result).toEqual({ error: { _db: ['boom'] } });
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});
