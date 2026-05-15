import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSend = vi.fn();
vi.mock('../lib/send-suggestion-email', () => ({
  sendSuggestionEmail: (...a: unknown[]) => mockSend(...a),
}));

const citySingle = vi.fn();
const countrySingle = vi.fn();

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => ({
    from: (table: string) => {
      const single = table === 'cities' ? citySingle : countrySingle;
      const chain: Record<string, unknown> = {};
      chain.select = () => chain;
      chain.eq = () => chain;
      chain.single = single;
      return chain;
    },
  }),
}));

import { submitSuggestion } from '../actions/submit-suggestion';

const UUID = '11111111-1111-1111-1111-111111111111';
const base = {
  fullName: 'Ana',
  serviceNeeded: 'Cocina',
  email: 'ana@example.com',
  countryId: UUID,
  cityId: UUID,
  comments: '',
  locale: 'es',
  honeypot: '',
  elapsedMs: 5000,
};

beforeEach(() => {
  mockSend.mockReset();
  citySingle.mockReset();
  countrySingle.mockReset();
  citySingle.mockResolvedValue({
    data: { id: UUID, country_id: UUID, i18n: { es: { name: 'Madrid' } } },
  });
  countrySingle.mockResolvedValue({
    data: { id: UUID, i18n: { es: { name: 'España' } } },
  });
});

describe('submitSuggestion', () => {
  it('honeypot filled → spam, no DB read, no send', async () => {
    const r = await submitSuggestion({ ...base, honeypot: 'x' });
    expect(r).toEqual({ error: { code: 'spam' } });
    expect(citySingle).not.toHaveBeenCalled();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('too-fast submit → spam', async () => {
    const r = await submitSuggestion({ ...base, elapsedMs: 100 });
    expect(r).toEqual({ error: { code: 'spam' } });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('invalid field → invalid + fieldErrors, no send', async () => {
    const r = await submitSuggestion({ ...base, email: 'bad' });
    expect(r).toMatchObject({ error: { code: 'invalid' } });
    if ('error' in r) expect(r.error.fieldErrors?.email).toBeTruthy();
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('city not in country → invalid-location, no send', async () => {
    citySingle.mockResolvedValueOnce({ data: null });
    const r = await submitSuggestion(base);
    expect(r).toEqual({ error: { code: 'invalid-location' } });
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('email not configured → email-not-configured', async () => {
    mockSend.mockRejectedValueOnce(new Error('EMAIL_NOT_CONFIGURED'));
    const r = await submitSuggestion(base);
    expect(r).toEqual({ error: { code: 'email-not-configured' } });
  });

  it('sender throws other → send-failed', async () => {
    mockSend.mockRejectedValueOnce(new Error('EMAIL_SEND_FAILED'));
    const r = await submitSuggestion(base);
    expect(r).toEqual({ error: { code: 'send-failed' } });
  });

  it('happy path → ok, sender called with resolved names', async () => {
    mockSend.mockResolvedValueOnce(undefined);
    const r = await submitSuggestion(base);
    expect(r).toEqual({ data: { ok: true } });
    expect(mockSend).toHaveBeenCalledWith(
      expect.objectContaining({
        countryName: 'España',
        cityName: 'Madrid',
        email: 'ana@example.com',
      }),
    );
  });
});
