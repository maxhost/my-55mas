import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { FaqInput } from '../../types';

const mockTranslate = vi.fn();
vi.mock('../../lib/translate-faqs-with-claude', () => ({
  translateFaqsTranslations: (...args: unknown[]) => mockTranslate(...args),
}));

const mockEq = vi.fn();
const mockUpdate = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      update: (payload: unknown) => {
        mockUpdate(payload);
        return { eq: mockEq };
      },
    }),
  }),
}));

const mockRevalidate = vi.fn();
vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidate(...args),
}));

vi.mock('@/lib/env', () => ({
  env: { ANTHROPIC_API_KEY: 'k', ANTHROPIC_MODEL: 'm' },
}));

import { translateFaqs } from '../translate-faqs';

function faq(
  id: string | undefined,
  esQuestion: string | null,
  esAnswer: string | null,
): FaqInput {
  const translations: FaqInput['translations'] = {};
  if (esQuestion !== null && esAnswer !== null) {
    translations.es = { question: esQuestion, answer: esAnswer };
  }
  return { id, sort_order: 0, is_active: true, translations };
}

describe('translateFaqs', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockRevalidate.mockReset();
    mockEq.mockResolvedValue({ error: null });
  });

  it('returns invalid-input when payload fails Zod (missing ES translation)', async () => {
    const result = await translateFaqs({
      faqs: [
        // FaqInput schema requires ES — empty translations is invalid.
        faq('00000000-0000-0000-0000-000000000001', null, null),
      ],
    });
    expect(result).toHaveProperty('error');
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it('returns es-incomplete when no FAQ has both ES question and answer (unsaved)', async () => {
    const f = faq(undefined, 'P', 'R');
    const result = await translateFaqs({ faqs: [f] });
    expect(result).toEqual({ error: 'es-incomplete' });
  });

  it('returns too-many-faqs over 50', async () => {
    const many = Array.from({ length: 51 }, (_, i) =>
      faq(
        `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
        `P${i}`,
        `R${i}`,
      ),
    );
    const result = await translateFaqs({ faqs: many });
    expect(result).toEqual({ error: 'too-many-faqs' });
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it('translates 4 locales and updates with merged i18n', async () => {
    mockTranslate.mockImplementation(
      (
        items: { id: string; question: string; answer: string }[],
        locale: string,
      ) =>
        Promise.resolve(
          items.map((it) => ({
            id: it.id,
            question: `${it.question}-${locale}`,
            answer: `${it.answer}-${locale}`,
          })),
        ),
    );

    const id = '00000000-0000-0000-0000-000000000001';
    const result = await translateFaqs({
      faqs: [faq(id, 'P', 'R')],
    });

    expect(result).toEqual({
      data: { translatedLocales: ['en', 'pt', 'fr', 'ca'] },
    });
    expect(mockTranslate).toHaveBeenCalledTimes(4);
    expect(mockUpdate).toHaveBeenCalledOnce();
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.i18n.es).toEqual({ question: 'P', answer: 'R' });
    expect(payload.i18n.en).toEqual({ question: 'P-en', answer: 'R-en' });
    expect(payload.i18n.pt).toEqual({ question: 'P-pt', answer: 'R-pt' });
    expect(mockRevalidate).toHaveBeenCalledOnce();
  });

  it('preserves existing target i18n when LLM omits a faq', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    const f = faq(id, 'P', 'R');
    f.translations.en = { question: 'kept-Q', answer: 'kept-A' };

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockTranslate.mockImplementation(
      (
        items: { id: string; question: string; answer: string }[],
        locale: string,
      ) => {
        if (locale === 'en') return Promise.resolve([]);
        return Promise.resolve(
          items.map((it) => ({
            id: it.id,
            question: `${it.question}-${locale}`,
            answer: `${it.answer}-${locale}`,
          })),
        );
      },
    );

    await translateFaqs({ faqs: [f] });
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.i18n.en).toEqual({ question: 'kept-Q', answer: 'kept-A' });
    expect(payload.i18n.pt.question).toBe('P-pt');
    warnSpy.mockRestore();
  });

  it('returns translate-failed when helper rejects, no DB write', async () => {
    mockTranslate
      .mockResolvedValueOnce([
        {
          id: '00000000-0000-0000-0000-000000000001',
          question: 'a',
          answer: 'a',
        },
      ])
      .mockResolvedValueOnce([
        {
          id: '00000000-0000-0000-0000-000000000001',
          question: 'b',
          answer: 'b',
        },
      ])
      .mockRejectedValueOnce(new Error('translate-claude-malformed'))
      .mockResolvedValueOnce([
        {
          id: '00000000-0000-0000-0000-000000000001',
          question: 'c',
          answer: 'c',
        },
      ]);

    const result = await translateFaqs({
      faqs: [faq('00000000-0000-0000-0000-000000000001', 'P', 'R')],
    });
    expect(result).toEqual({ error: 'translate-failed' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns db-failed when UPDATE rejects', async () => {
    mockTranslate.mockImplementation(
      (
        items: { id: string; question: string; answer: string }[],
        locale: string,
      ) =>
        Promise.resolve(
          items.map((it) => ({
            id: it.id,
            question: `${it.question}-${locale}`,
            answer: `${it.answer}-${locale}`,
          })),
        ),
    );
    mockEq.mockResolvedValue({ error: { message: 'boom' } });

    const result = await translateFaqs({
      faqs: [faq('00000000-0000-0000-0000-000000000001', 'P', 'R')],
    });
    expect(result).toEqual({ error: 'db-failed' });
  });
});
