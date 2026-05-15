import { describe, it, expect } from 'vitest';
import { suggestionSchema } from '../schemas';

const UUID = '11111111-1111-1111-1111-111111111111';

const base = {
  fullName: 'Ana López',
  serviceNeeded: 'Clases de cocina',
  email: 'ana@example.com',
  countryId: UUID,
  cityId: UUID,
  comments: '',
  locale: 'es',
  honeypot: '',
  elapsedMs: 5000,
};

describe('suggestionSchema', () => {
  it('accepts a valid payload', () => {
    expect(suggestionSchema.safeParse(base).success).toBe(true);
  });

  it('comments defaults to empty string when omitted', () => {
    const { comments, ...rest } = base;
    void comments;
    const r = suggestionSchema.safeParse(rest);
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.comments).toBe('');
  });

  it('rejects invalid email', () => {
    expect(
      suggestionSchema.safeParse({ ...base, email: 'nope' }).success,
    ).toBe(false);
  });

  it('rejects empty required fields', () => {
    expect(
      suggestionSchema.safeParse({ ...base, fullName: '   ' }).success,
    ).toBe(false);
  });

  it('rejects non-uuid country/city ids', () => {
    expect(
      suggestionSchema.safeParse({ ...base, countryId: 'es' }).success,
    ).toBe(false);
    expect(
      suggestionSchema.safeParse({ ...base, cityId: 'x' }).success,
    ).toBe(false);
  });

  it('rejects invalid locale', () => {
    expect(
      suggestionSchema.safeParse({ ...base, locale: 'de' }).success,
    ).toBe(false);
  });

  it('rejects non-empty honeypot (bot)', () => {
    const r = suggestionSchema.safeParse({ ...base, honeypot: 'x' });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.flatten().fieldErrors.honeypot).toBeTruthy();
  });

  it('rejects elapsedMs below 2500 (too fast = bot)', () => {
    const r = suggestionSchema.safeParse({ ...base, elapsedMs: 800 });
    expect(r.success).toBe(false);
    if (!r.success)
      expect(r.error.flatten().fieldErrors.elapsedMs).toBeTruthy();
  });

  it('rejects absurdly large elapsedMs (stale token)', () => {
    expect(
      suggestionSchema.safeParse({ ...base, elapsedMs: 1000 * 60 * 60 * 5 })
        .success,
    ).toBe(false);
  });

  it('caps over-long fields', () => {
    expect(
      suggestionSchema.safeParse({ ...base, fullName: 'a'.repeat(121) })
        .success,
    ).toBe(false);
  });
});
