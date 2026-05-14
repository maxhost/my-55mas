import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSingleRead = vi.fn();
const mockSingleWrite = vi.fn();
const mockSelectRead = vi.fn();
const mockSelectWrite = vi.fn();
const mockEqRead = vi.fn();
const mockEqWrite = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      select: () => {
        mockSelectRead();
        return { eq: mockEqRead };
      },
      update: (payload: unknown) => {
        mockUpdate(payload);
        return {
          eq: () => {
            mockEqWrite();
            return { select: mockSelectWrite };
          },
        };
      },
    }),
  }),
}));

const mockRevalidate = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidate(...args),
}));

const mockSanitize = vi.fn((html: string) => `sanitized:${html}`);
vi.mock('@/shared/lib/lexical/sanitize-rich-html', () => ({
  sanitizeRichHtml: (html: string) => mockSanitize(html),
}));

import { saveLegalDocument } from '../save-legal-document';

const VALID_STATE = { root: { type: 'root', children: [] } };

const BASE_INPUT = {
  slug: 'terms' as const,
  expectedUpdatedAt: '2026-05-14T10:00:00.000Z',
  translations: {
    es: { lexicalState: VALID_STATE, richHtml: '<p>ES</p>' },
    en: { lexicalState: VALID_STATE, richHtml: '<p>EN</p>' },
  },
};

describe('saveLegalDocument', () => {
  beforeEach(() => {
    mockSingleRead.mockReset();
    mockSingleWrite.mockReset();
    mockSelectRead.mockReset();
    mockSelectWrite.mockReset();
    mockEqRead.mockReset();
    mockEqWrite.mockReset();
    mockUpdate.mockReset();
    mockRevalidate.mockReset();
    mockSanitize.mockClear();
    mockEqRead.mockReturnValue({ single: mockSingleRead });
    mockSelectWrite.mockReturnValue({ single: mockSingleWrite });
    mockSingleRead.mockResolvedValue({
      data: { updated_at: BASE_INPUT.expectedUpdatedAt },
      error: null,
    });
    mockSingleWrite.mockResolvedValue({
      data: { updated_at: '2026-05-14T11:00:00.000Z' },
      error: null,
    });
  });

  it('rejects invalid input before touching DB', async () => {
    const result = await saveLegalDocument({
      ...BASE_INPUT,
      slug: 'unknown' as never,
    });
    expect(result).toEqual({ error: 'invalid-input' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns optimistic-lock when updated_at moved since the fetch', async () => {
    mockSingleRead.mockResolvedValueOnce({
      data: { updated_at: '2026-05-14T11:00:00.000Z' },
      error: null,
    });
    const result = await saveLegalDocument(BASE_INPUT);
    expect(result).toEqual({ error: 'optimistic-lock' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns not-found when the row does not exist', async () => {
    mockSingleRead.mockResolvedValueOnce({
      data: null,
      error: { message: 'no rows' },
    });
    const result = await saveLegalDocument(BASE_INPUT);
    expect(result).toEqual({ error: 'not-found' });
  });

  it('sanitizes each locale richHtml before persisting', async () => {
    await saveLegalDocument(BASE_INPUT);
    expect(mockSanitize).toHaveBeenCalledTimes(2);
    expect(mockSanitize.mock.calls.map((c) => c[0]).sort()).toEqual(
      ['<p>EN</p>', '<p>ES</p>'].sort(),
    );
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.i18n.es.richHtml).toBe('sanitized:<p>ES</p>');
    expect(payload.i18n.en.richHtml).toBe('sanitized:<p>EN</p>');
  });

  it('preserves lexicalState as-is per locale', async () => {
    await saveLegalDocument(BASE_INPUT);
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.i18n.es.lexicalState).toEqual(VALID_STATE);
    expect(payload.i18n.en.lexicalState).toEqual(VALID_STATE);
  });

  it('returns new updated_at on success and revalidates', async () => {
    const result = await saveLegalDocument(BASE_INPUT);
    expect(result).toEqual({
      data: { updated_at: '2026-05-14T11:00:00.000Z' },
    });
    expect(mockRevalidate).toHaveBeenCalledOnce();
  });

  it('returns db-failed when the UPDATE rejects', async () => {
    mockSingleWrite.mockResolvedValueOnce({
      data: null,
      error: { message: 'boom' },
    });
    const result = await saveLegalDocument(BASE_INPUT);
    expect(result).toEqual({ error: 'db-failed' });
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});
