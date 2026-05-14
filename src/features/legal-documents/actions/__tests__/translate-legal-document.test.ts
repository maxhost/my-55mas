import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTranslate = vi.fn();
vi.mock('../../lib/translate-legal-doc-with-claude', () => ({
  translateLegalDocHtml: (...args: unknown[]) => mockTranslate(...args),
}));

const mockSingleRead = vi.fn();
const mockSingleWrite = vi.fn();
const mockSelectWrite = vi.fn();
const mockEqRead = vi.fn();
const mockEqWrite = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({ eq: mockEqRead }),
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

vi.mock('@/lib/env', () => ({
  env: { ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: 'm' },
}));

import { translateLegalDocument } from '../translate-legal-document';

const VALID_STATE = { root: { type: 'root', children: [] } };

const BASE_INPUT = {
  slug: 'terms' as const,
  expectedUpdatedAt: '2026-05-14T10:00:00.000Z',
  esTranslation: {
    lexicalState: VALID_STATE,
    richHtml: '<p>Original</p>',
  },
};

describe('translateLegalDocument', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    mockSingleRead.mockReset();
    mockSingleWrite.mockReset();
    mockEqRead.mockReset();
    mockEqWrite.mockReset();
    mockSelectWrite.mockReset();
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

  it('rejects invalid slug', async () => {
    const result = await translateLegalDocument({
      ...BASE_INPUT,
      slug: 'unknown' as never,
    });
    expect(result).toEqual({ error: 'invalid-input' });
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it('returns es-empty when richHtml is whitespace only', async () => {
    const result = await translateLegalDocument({
      ...BASE_INPUT,
      esTranslation: { ...BASE_INPUT.esTranslation, richHtml: '   \n  ' },
    });
    expect(result).toEqual({ error: 'es-empty' });
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it('returns doc-too-large when richHtml exceeds 100KB', async () => {
    const huge = '<p>' + 'x'.repeat(100_001) + '</p>';
    const result = await translateLegalDocument({
      ...BASE_INPUT,
      esTranslation: { ...BASE_INPUT.esTranslation, richHtml: huge },
    });
    expect(result).toEqual({ error: 'doc-too-large' });
  });

  it('returns optimistic-lock when updated_at moved', async () => {
    mockSingleRead.mockResolvedValueOnce({
      data: { updated_at: '2026-05-14T12:00:00.000Z' },
      error: null,
    });
    const result = await translateLegalDocument(BASE_INPUT);
    expect(result).toEqual({ error: 'optimistic-lock' });
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it('returns not-found when the row does not exist', async () => {
    mockSingleRead.mockResolvedValueOnce({
      data: null,
      error: { message: 'no rows' },
    });
    const result = await translateLegalDocument(BASE_INPUT);
    expect(result).toEqual({ error: 'not-found' });
  });

  it('translates 4 locales and persists ES + 4 targets', async () => {
    mockTranslate.mockImplementation((_html: string, locale: string) =>
      Promise.resolve(`<p>translated-${locale}</p>`),
    );

    const result = await translateLegalDocument(BASE_INPUT);

    expect(result).toEqual({
      data: { updated_at: '2026-05-14T11:00:00.000Z' },
    });
    expect(mockTranslate).toHaveBeenCalledTimes(4);
    expect(mockUpdate).toHaveBeenCalledOnce();
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.i18n.es.lexicalState).toEqual(VALID_STATE);
    expect(payload.i18n.es.richHtml).toBe('sanitized:<p>Original</p>');
    for (const locale of ['en', 'pt', 'fr', 'ca']) {
      expect(payload.i18n[locale].lexicalState).toBeNull();
      expect(payload.i18n[locale].richHtml).toBe(
        `sanitized:<p>translated-${locale}</p>`,
      );
    }
    expect(mockRevalidate).toHaveBeenCalledOnce();
  });

  it('sanitizes ES + every target translation HTML', async () => {
    mockTranslate.mockResolvedValue('<p>x</p>');
    await translateLegalDocument(BASE_INPUT);
    // ES + 4 targets = 5 sanitize calls.
    expect(mockSanitize).toHaveBeenCalledTimes(5);
  });

  it('returns translate-failed when helper rejects, no DB write', async () => {
    mockTranslate
      .mockResolvedValueOnce('<p>en</p>')
      .mockRejectedValueOnce(new Error('translate-claude-malformed'))
      .mockResolvedValueOnce('<p>fr</p>')
      .mockResolvedValueOnce('<p>ca</p>');
    const result = await translateLegalDocument(BASE_INPUT);
    expect(result).toEqual({ error: 'translate-failed' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns db-failed when UPDATE rejects', async () => {
    mockTranslate.mockResolvedValue('<p>x</p>');
    mockSingleWrite.mockResolvedValueOnce({
      data: null,
      error: { message: 'boom' },
    });
    const result = await translateLegalDocument(BASE_INPUT);
    expect(result).toEqual({ error: 'db-failed' });
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});
