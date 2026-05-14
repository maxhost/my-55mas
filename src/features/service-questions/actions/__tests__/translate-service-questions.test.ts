import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Question } from '@/shared/lib/questions/types';

const mockTranslate = vi.fn();
vi.mock('../../lib/translate-questions-with-claude', () => ({
  translateQuestionsTranslations: (...args: unknown[]) =>
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
  env: { ANTHROPIC_API_KEY: 'test-key', ANTHROPIC_MODEL: 'm' },
}));

import { translateServiceQuestions } from '../translate-service-questions';

const SERVICE_ID = '00000000-0000-0000-0000-000000000001';

function q(
  key: string,
  esLabel: string | null,
  extra: Partial<Question> = {},
): Question {
  const i18n: Question['i18n'] = {};
  if (esLabel !== null) i18n.es = { label: esLabel };
  return {
    key,
    type: 'text',
    required: false,
    i18n,
    ...extra,
  };
}

function manualSelectQ(
  key: string,
  esLabel: string,
  options: Array<{ value: string; esLabel: string | null }>,
): Question {
  return {
    key,
    type: 'singleSelect',
    required: false,
    i18n: { es: { label: esLabel } },
    optionsSource: 'manual',
    options: options.map((o) => ({
      value: o.value,
      i18n: o.esLabel === null ? {} : { es: { label: o.esLabel } },
    })),
  };
}

function subtypeQ(key: string, esLabel: string): Question {
  return {
    key,
    type: 'singleSelect',
    required: false,
    i18n: { es: { label: esLabel } },
    optionsSource: 'subtype',
    subtypeGroupSlug: 'cuisine',
  };
}

function translatedQuestion(key: string, suffix: string) {
  return { key, label: `${key}-${suffix}` };
}

describe('translateServiceQuestions', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockRevalidate.mockReset();
    mockEq.mockResolvedValue({ error: null });
  });

  it('returns invalid-input when service_id is not a UUID', async () => {
    const result = await translateServiceQuestions({
      service_id: 'nope',
      target: 'client',
      questions: [q('k1', 'hola')],
    });
    expect(result).toEqual({ error: 'invalid-input' });
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it('returns es-incomplete when no question has ES label', async () => {
    const result = await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [q('k1', null)],
    });
    expect(result).toEqual({ error: 'es-incomplete' });
    expect(mockTranslate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns too-many-questions when more than 50 have ES label', async () => {
    const many = Array.from({ length: 51 }, (_, i) => q(`k${i}`, `label ${i}`));
    const result = await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: many,
    });
    expect(result).toEqual({ error: 'too-many-questions' });
    expect(mockTranslate).not.toHaveBeenCalled();
  });

  it('translates 4 locales and writes single update to client column', async () => {
    mockTranslate.mockImplementation((_items, locale: string) =>
      Promise.resolve([translatedQuestion('k1', locale)]),
    );

    const result = await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [q('k1', 'hola')],
    });

    expect(result).toEqual({
      data: { translatedLocales: ['en', 'pt', 'fr', 'ca'] },
    });
    expect(mockTranslate).toHaveBeenCalledTimes(4);
    expect(mockUpdate).toHaveBeenCalledOnce();
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload).toHaveProperty('questions');
    expect(payload.questions[0].i18n.en.label).toBe('k1-en');
    expect(payload.questions[0].i18n.pt.label).toBe('k1-pt');
    expect(payload.questions[0].i18n.es.label).toBe('hola');
    expect(mockRevalidate).toHaveBeenCalledOnce();
  });

  it('writes to talent_questions column when target=talent', async () => {
    mockTranslate.mockImplementation((_items, locale: string) =>
      Promise.resolve([translatedQuestion('k1', locale)]),
    );
    await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'talent',
      questions: [q('k1', 'hola')],
    });
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload).toHaveProperty('talent_questions');
    expect(payload).not.toHaveProperty('questions');
  });

  it('preserves questions without ES label untouched (skip)', async () => {
    mockTranslate.mockImplementation((items, locale: string) =>
      Promise.resolve(
        (items as Array<{ key: string }>).map((it) =>
          translatedQuestion(it.key, locale),
        ),
      ),
    );
    const result = await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [
        q('with_es', 'hola'),
        // Pre-existing target translations on a question we DON'T touch
        q('no_es', null, {
          i18n: { en: { label: 'preexisting' } },
        }),
      ],
    });
    expect(result).toHaveProperty('data');
    const payload = mockUpdate.mock.calls[0][0];
    // The 1 item sent for translation was 'with_es' only
    expect(mockTranslate.mock.calls[0][0]).toHaveLength(1);
    expect(mockTranslate.mock.calls[0][0][0].key).toBe('with_es');
    // The no_es question keeps its pre-existing en translation
    expect(payload.questions[1].i18n.en.label).toBe('preexisting');
  });

  it('does NOT translate subtype options (only header label/placeholder/help)', async () => {
    mockTranslate.mockImplementation((items, locale: string) => {
      // Echo what we got; if items had options the LLM would too. Subtype
      // shouldn't reach the helper with options at all.
      const arr = items as Array<{ key: string; options?: unknown }>;
      return Promise.resolve(
        arr.map((it) => ({
          key: it.key,
          label: `${it.key}-${locale}`,
        })),
      );
    });
    await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [subtypeQ('q1', 'header label')],
    });
    // Verify the helper got NO options for the subtype question
    const sentItems = mockTranslate.mock.calls[0][0];
    expect(sentItems[0].options).toBeUndefined();
  });

  it('translates manual options when ES label present, skips options without ES', async () => {
    mockTranslate.mockImplementation((items, locale: string) => {
      const arr = items as Array<{
        key: string;
        options?: Array<{ value: string; label: string }>;
      }>;
      return Promise.resolve(
        arr.map((it) => ({
          key: it.key,
          label: `${it.key}-${locale}`,
          options: it.options?.map((o) => ({
            value: o.value,
            label: `${o.value}-${locale}`,
          })),
        })),
      );
    });
    const question = manualSelectQ('q1', 'parent', [
      { value: 'a', esLabel: 'opcion a' },
      { value: 'b', esLabel: null }, // skipped
    ]);
    // Preserve b's existing en translation
    question.options![1].i18n = { en: { label: 'preexisting b' } };
    await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [question],
    });
    const sentItems = mockTranslate.mock.calls[0][0];
    expect(sentItems[0].options).toEqual([{ value: 'a', label: 'opcion a' }]);
    const payload = mockUpdate.mock.calls[0][0];
    const persistedOptions = payload.questions[0].options;
    expect(persistedOptions[0].i18n.en.label).toBe('a-en');
    // b had no ES label, so we preserve its pre-existing en translation
    expect(persistedOptions[1].i18n.en.label).toBe('preexisting b');
  });

  it('skips unknown keys returned by the LLM with a console.warn', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockTranslate.mockImplementation((_items, locale: string) =>
      Promise.resolve([
        translatedQuestion('q1', locale),
        translatedQuestion('phantom', locale), // not in source
      ]),
    );
    await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [q('q1', 'hello')],
    });
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.questions).toHaveLength(1);
    expect(payload.questions[0].key).toBe('q1');
    warnSpy.mockRestore();
  });

  it('preserves option translations when LLM returns fewer options than source', async () => {
    mockTranslate.mockImplementation((_items, locale: string) =>
      Promise.resolve([
        {
          key: 'q1',
          label: `q1-${locale}`,
          // LLM returns only one option, source had two
          options: [{ value: 'a', label: `a-${locale}` }],
        },
      ]),
    );
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const question = manualSelectQ('q1', 'parent', [
      { value: 'a', esLabel: 'opcion a' },
      { value: 'b', esLabel: 'opcion b' },
    ]);
    // Preserve b's existing en translation
    question.options![1].i18n = { es: { label: 'opcion b' }, en: { label: 'kept b' } };
    await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [question],
    });
    const persisted = mockUpdate.mock.calls[0][0].questions[0].options;
    expect(persisted[0].i18n.en.label).toBe('a-en');
    // b was not in the LLM response → en translation preserved
    expect(persisted[1].i18n.en.label).toBe('kept b');
    warnSpy.mockRestore();
  });

  it('returns translate-failed when helper rejects, no DB write', async () => {
    mockTranslate
      .mockResolvedValueOnce([translatedQuestion('k1', 'en')])
      .mockResolvedValueOnce([translatedQuestion('k1', 'pt')])
      .mockRejectedValueOnce(new Error('translate-claude-malformed'))
      .mockResolvedValueOnce([translatedQuestion('k1', 'ca')]);

    const result = await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [q('k1', 'hola')],
    });

    expect(result).toEqual({ error: 'translate-failed' });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('returns db-failed when UPDATE rejects', async () => {
    mockTranslate.mockImplementation((_items, locale: string) =>
      Promise.resolve([translatedQuestion('k1', locale)]),
    );
    mockEq.mockResolvedValue({ error: { message: 'db down' } });

    const result = await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [q('k1', 'hola')],
    });

    expect(result).toEqual({ error: 'db-failed' });
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('persists ES from input (auto-save semantics)', async () => {
    mockTranslate.mockImplementation((_items, locale: string) =>
      Promise.resolve([translatedQuestion('k1', locale)]),
    );
    await translateServiceQuestions({
      service_id: SERVICE_ID,
      target: 'client',
      questions: [q('k1', 'NEW ES FROM FORM')],
    });
    const payload = mockUpdate.mock.calls[0][0];
    expect(payload.questions[0].i18n.es.label).toBe('NEW ES FROM FORM');
  });
});
