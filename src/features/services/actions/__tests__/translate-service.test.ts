import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockTranslate = vi.fn();
vi.mock('../../lib/translate-with-claude', () => ({
  translateServiceTranslation: (...args: unknown[]) => mockTranslate(...args),
}));

const mockSingle = vi.fn();
const mockEq = vi.fn();
const mockUpdate = vi.fn();
vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({ single: mockSingle }),
      }),
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

import { translateService } from '../translate-service';

const SERVICE_ID = '00000000-0000-0000-0000-000000000001';

const ES = {
  locale: 'es' as const,
  name: 'Acompañamiento',
  description: 'Servicio...',
  includes: null,
  hero_title: null,
  hero_subtitle: null,
  benefits: ['x'],
  guarantees: [],
  faqs: [],
};

const TRANSLATED = {
  name: 'Companionship',
  description: 'Service...',
  includes: '',
  hero_title: '',
  hero_subtitle: '',
  benefits: ['x-en'],
  guarantees: [],
  faqs: [],
};

describe('translateService', () => {
  beforeEach(() => {
    mockTranslate.mockReset();
    mockUpdate.mockReset();
    mockEq.mockReset();
    mockSingle.mockReset();
    mockRevalidate.mockReset();
    mockEq.mockResolvedValue({ error: null });
  });

  it('returns es-incomplete when ES name is empty', async () => {
    const result = await translateService({
      service_id: SERVICE_ID,
      esTranslation: { ...ES, name: '' },
    });
    expect(result).toEqual({ error: 'es-incomplete' });
    expect(mockTranslate).not.toHaveBeenCalled();
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it('returns invalid-input when service_id is not a UUID', async () => {
    const result = await translateService({
      service_id: 'not-uuid',
      esTranslation: ES,
    });
    expect(result).toHaveProperty('error');
  });

  it('translates 4 locales and writes a single update', async () => {
    mockSingle.mockResolvedValue({ data: { i18n: {} }, error: null });
    mockTranslate.mockResolvedValue(TRANSLATED);

    const result = await translateService({
      service_id: SERVICE_ID,
      esTranslation: ES,
    });

    expect(result).toEqual({
      data: { translatedLocales: ['en', 'pt', 'fr', 'ca'] },
    });
    expect(mockTranslate).toHaveBeenCalledTimes(4);
    expect(mockUpdate).toHaveBeenCalledOnce();
    const written = mockUpdate.mock.calls[0][0].i18n;
    expect(written).toHaveProperty('es');
    expect(written).toHaveProperty('en');
    expect(written).toHaveProperty('pt');
    expect(written).toHaveProperty('fr');
    expect(written).toHaveProperty('ca');
    expect(mockRevalidate).toHaveBeenCalledOnce();
  });

  it('preserves jsonb keys that are not the 5 supported locales', async () => {
    mockSingle.mockResolvedValue({
      data: { i18n: { extra_key: { foo: 'bar' } } },
      error: null,
    });
    mockTranslate.mockResolvedValue(TRANSLATED);

    await translateService({
      service_id: SERVICE_ID,
      esTranslation: ES,
    });

    const written = mockUpdate.mock.calls[0][0].i18n;
    expect(written.extra_key).toEqual({ foo: 'bar' });
  });

  it('persists the ES from input (auto-save), not the DB version', async () => {
    mockSingle.mockResolvedValue({
      data: { i18n: { es: { name: 'OLD ES IN DB' } } },
      error: null,
    });
    mockTranslate.mockResolvedValue(TRANSLATED);

    await translateService({
      service_id: SERVICE_ID,
      esTranslation: { ...ES, name: 'NEW ES FROM FORM' },
    });

    const written = mockUpdate.mock.calls[0][0].i18n;
    expect(written.es.name).toBe('NEW ES FROM FORM');
  });

  it('returns translate-failed when any helper call rejects, with no DB write', async () => {
    mockSingle.mockResolvedValue({ data: { i18n: {} }, error: null });
    mockTranslate
      .mockResolvedValueOnce(TRANSLATED)
      .mockResolvedValueOnce(TRANSLATED)
      .mockRejectedValueOnce(new Error('translate-claude-malformed'))
      .mockResolvedValueOnce(TRANSLATED);

    const result = await translateService({
      service_id: SERVICE_ID,
      esTranslation: ES,
    });

    expect(result).toEqual({ error: 'translate-failed' });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockRevalidate).not.toHaveBeenCalled();
  });

  it('returns db-failed when the UPDATE rejects', async () => {
    mockSingle.mockResolvedValue({ data: { i18n: {} }, error: null });
    mockTranslate.mockResolvedValue(TRANSLATED);
    mockEq.mockResolvedValue({ error: { message: 'db down' } });

    const result = await translateService({
      service_id: SERVICE_ID,
      esTranslation: ES,
    });

    expect(result).toEqual({ error: 'db-failed' });
    expect(mockRevalidate).not.toHaveBeenCalled();
  });
});
