import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockOrder2 = vi.fn();
const mockOrder1 = vi.fn(() => ({ order: mockOrder2 }));
const mockEq = vi.fn(() => ({ order: mockOrder1 }));
const mockSelect = vi.fn(() => ({ eq: mockEq }));

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({ from: () => ({ select: mockSelect }) }),
}));

import { loadPublicFaqs } from '../load-public-faqs';

beforeEach(() => {
  mockOrder2.mockReset();
  mockOrder1.mockClear();
  mockEq.mockClear();
  mockSelect.mockClear();
});

describe('loadPublicFaqs', () => {
  it('happy path: loads two active FAQs localized to target locale', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        {
          id: 'f1',
          sort_order: 0,
          is_active: true,
          created_at: '2026-05-01T00:00:00Z',
          i18n: { en: { question: 'What is 55+?', answer: 'A marketplace' } },
        },
        {
          id: 'f2',
          sort_order: 1,
          is_active: true,
          created_at: '2026-05-02T00:00:00Z',
          i18n: { en: { question: 'How does it work?', answer: 'You hire talents' } },
        },
      ],
      error: null,
    });

    const result = await loadPublicFaqs('en');

    expect(result).toEqual([
      { id: 'f1', question: 'What is 55+?', answer: 'A marketplace' },
      { id: 'f2', question: 'How does it work?', answer: 'You hire talents' },
    ]);
    expect(mockSelect).toHaveBeenCalledWith(
      'id, sort_order, is_active, i18n, created_at',
    );
    expect(mockEq).toHaveBeenCalledWith('is_active', true);
    expect(mockOrder1).toHaveBeenCalledWith('sort_order', { ascending: true });
    expect(mockOrder2).toHaveBeenCalledWith('created_at', { ascending: false });
  });

  it('falls back to ES when target locale has no entry', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        {
          id: 'f1',
          sort_order: 0,
          is_active: true,
          created_at: '2026-05-01T00:00:00Z',
          i18n: { es: { question: '¿Qué es 55+?', answer: 'Un marketplace' } },
        },
      ],
      error: null,
    });

    const result = await loadPublicFaqs('fr');

    expect(result).toEqual([
      { id: 'f1', question: '¿Qué es 55+?', answer: 'Un marketplace' },
    ]);
  });

  it('skips entries with missing question or answer', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: [
        {
          id: 'f1',
          sort_order: 0,
          is_active: true,
          created_at: '2026-05-01T00:00:00Z',
          i18n: { es: { question: 'Q1' } }, // no answer
        },
        {
          id: 'f2',
          sort_order: 1,
          is_active: true,
          created_at: '2026-05-02T00:00:00Z',
          i18n: { es: { answer: 'A2' } }, // no question
        },
        {
          id: 'f3',
          sort_order: 2,
          is_active: true,
          created_at: '2026-05-03T00:00:00Z',
          i18n: { es: { question: '  ', answer: 'A3' } }, // whitespace question
        },
        {
          id: 'f4',
          sort_order: 3,
          is_active: true,
          created_at: '2026-05-04T00:00:00Z',
          i18n: { es: { question: 'Q4', answer: 'A4' } },
        },
      ],
      error: null,
    });

    const result = await loadPublicFaqs('es');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('f4');
  });

  it('returns [] (no throw) when supabase reports an error', async () => {
    mockOrder2.mockResolvedValueOnce({
      data: null,
      error: { message: 'boom' },
    });

    const result = await loadPublicFaqs('es');
    expect(result).toEqual([]);
  });

  it('returns [] (no throw) when the supabase call itself throws', async () => {
    mockOrder2.mockRejectedValueOnce(new Error('network down'));

    const result = await loadPublicFaqs('es');
    expect(result).toEqual([]);
  });

  it('returns [] (no throw) when data is null', async () => {
    mockOrder2.mockResolvedValueOnce({ data: null, error: null });

    const result = await loadPublicFaqs('es');
    expect(result).toEqual([]);
  });
});
