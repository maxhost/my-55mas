import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { ReviewInput } from '../../types';

const mockTranslate = vi.fn();
vi.mock('../../lib/translate-reviews-with-claude', () => ({
  translateReviewsTranslations: (...args: unknown[]) =>
    mockTranslate(...args),
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

import { translateReviews } from '../translate-reviews';

function review(id: string, esText: string | null): ReviewInput {
  return {
    id,
    author_name: 'María',
    author_photo: null,
    stars: 5,
    sort_order: 0,
    is_active: true,
    translations: esText === null ? {} : { es: esText },
  };
}

describe('translateReviews', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockRevalidate.mockReset();
    mockEq.mockResolvedValue({ error: null });
  });

  it('returns es-incomplete when no review has ES text (only EN translation)', async () => {
    // A review with translations but none in ES — schema accepts it
    // (has at least one translation), action rejects because there's
    // no ES to translate FROM.
    const r = review('00000000-0000-0000-0000-000000000001', null);
    r.translations.en = 'only english';
    const result = await translateReviews({ reviews: [r] });
    expect(result).toEqual({ error: 'es-incomplete' });
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it('skips reviews without an id (pending insert) — action returns es-incomplete', async () => {
    const r = review('00000000-0000-0000-0000-000000000001', 'hola');
    r.id = undefined;
    const result = await translateReviews({ reviews: [r] });
    expect(result).toEqual({ error: 'es-incomplete' });
  });

  it('returns too-many-reviews when more than 50 have ES', async () => {
    const many = Array.from({ length: 51 }, (_, i) =>
      review(
        `00000000-0000-0000-0000-${String(i).padStart(12, '0')}`,
        `txt ${i}`,
      ),
    );
    const result = await translateReviews({ reviews: many });
    expect(result).toEqual({ error: 'too-many-reviews' });
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it('translates 4 locales and updates each review with merged i18n', async () => {
    mockTranslate.mockImplementation(
      (items: { id: string; text: string }[], locale: string) =>
        Promise.resolve(
          items.map((it) => ({ id: it.id, text: `${it.text}-${locale}` })),
        ),
    );

    const id = '00000000-0000-0000-0000-000000000001';
    const result = await translateReviews({
      reviews: [review(id, 'hola')],
    });

    expect(result).toEqual({
      data: { translatedLocales: ['en', 'pt', 'fr', 'ca'] },
    });
    expect(mockTranslate).toHaveBeenCalledTimes(4);
    expect(mockUpdate).toHaveBeenCalledOnce();
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.i18n.es).toEqual({ text: 'hola' });
    expect(payload.i18n.en).toEqual({ text: 'hola-en' });
    expect(payload.i18n.pt).toEqual({ text: 'hola-pt' });
    expect(mockRevalidate).toHaveBeenCalledOnce();
  });

  it('preserves existing target i18n when LLM omits a review', async () => {
    const id = '00000000-0000-0000-0000-000000000001';
    const r = review(id, 'hola');
    r.translations.en = 'preexisting-en';

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    // LLM omits this review in EN response but includes it in PT/FR/CA
    mockTranslate.mockImplementation(
      (items: { id: string; text: string }[], locale: string) => {
        if (locale === 'en') return Promise.resolve([]);
        return Promise.resolve(
          items.map((it) => ({ id: it.id, text: `${it.text}-${locale}` })),
        );
      },
    );

    await translateReviews({ reviews: [r] });
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.i18n.en).toEqual({ text: 'preexisting-en' });
    expect(payload.i18n.pt).toEqual({ text: 'hola-pt' });
    warnSpy.mockRestore();
  });

  it('returns translate-failed when helper rejects, no DB write', async () => {
    mockTranslate
      .mockResolvedValueOnce([{ id: '00000000-0000-0000-0000-000000000001', text: 'a' }])
      .mockResolvedValueOnce([{ id: '00000000-0000-0000-0000-000000000001', text: 'b' }])
      .mockRejectedValueOnce(new Error('translate-claude-malformed'))
      .mockResolvedValueOnce([{ id: '00000000-0000-0000-0000-000000000001', text: 'c' }]);

    const result = await translateReviews({
      reviews: [review('00000000-0000-0000-0000-000000000001', 'hola')],
    });

    expect(result).toEqual({ error: 'translate-failed' });
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns db-failed when UPDATE rejects', async () => {
    mockTranslate.mockImplementation(
      (items: { id: string; text: string }[], locale: string) =>
        Promise.resolve(
          items.map((it) => ({ id: it.id, text: `${it.text}-${locale}` })),
        ),
    );
    mockEq.mockResolvedValue({ error: { message: 'boom' } });

    const result = await translateReviews({
      reviews: [review('00000000-0000-0000-0000-000000000001', 'hola')],
    });
    expect(result).toEqual({ error: 'db-failed' });
  });
});
