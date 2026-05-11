import { describe, it, expect } from 'vitest';
import { FISCAL_VALIDATORS, validateFiscalId, normalizeFiscalId } from '../validators';

describe('FISCAL_VALIDATORS map', () => {
  it('has entries for the 4 active codes in DB', () => {
    expect(Object.keys(FISCAL_VALIDATORS).sort()).toEqual(['CUIL', 'CUIT', 'NIE', 'NIF']);
  });

  it('every entry is a RegExp', () => {
    for (const r of Object.values(FISCAL_VALIDATORS)) {
      expect(r).toBeInstanceOf(RegExp);
    }
  });
});

describe('validateFiscalId — NIF (Spain)', () => {
  it('accepts uppercase format', () => {
    expect(validateFiscalId('12345678Z', 'NIF')).toEqual({ ok: true });
  });

  it('accepts lowercase letter (normalized internally)', () => {
    expect(validateFiscalId('12345678z', 'NIF')).toEqual({ ok: true });
  });

  it('rejects too few digits', () => {
    expect(validateFiscalId('1234567Z', 'NIF')).toEqual({ ok: false, reason: 'format' });
  });

  it('rejects missing letter', () => {
    expect(validateFiscalId('12345678', 'NIF')).toEqual({ ok: false, reason: 'format' });
  });

  it('rejects garbage', () => {
    expect(validateFiscalId('qwerty', 'NIF')).toEqual({ ok: false, reason: 'format' });
  });
});

describe('validateFiscalId — NIE (Spain)', () => {
  it('accepts X-prefix', () => {
    expect(validateFiscalId('X1234567L', 'NIE')).toEqual({ ok: true });
  });

  it('accepts Y and Z prefixes', () => {
    expect(validateFiscalId('Y1234567L', 'NIE')).toEqual({ ok: true });
    expect(validateFiscalId('Z1234567L', 'NIE')).toEqual({ ok: true });
  });

  it('rejects W prefix', () => {
    expect(validateFiscalId('W1234567L', 'NIE')).toEqual({ ok: false, reason: 'format' });
  });
});

describe('validateFiscalId — CUIT/CUIL (Argentina)', () => {
  it('accepts with dashes', () => {
    expect(validateFiscalId('20-12345678-3', 'CUIT')).toEqual({ ok: true });
    expect(validateFiscalId('27-12345678-4', 'CUIL')).toEqual({ ok: true });
  });

  it('accepts without dashes', () => {
    expect(validateFiscalId('20123456783', 'CUIT')).toEqual({ ok: true });
  });

  it('rejects wrong length', () => {
    expect(validateFiscalId('20-1234567-3', 'CUIT')).toEqual({ ok: false, reason: 'format' });
  });

  it('rejects letters', () => {
    expect(validateFiscalId('XX-12345678-3', 'CUIT')).toEqual({ ok: false, reason: 'format' });
  });
});

describe('validateFiscalId — edge cases', () => {
  it('treats empty string as empty', () => {
    expect(validateFiscalId('', 'NIF')).toEqual({ ok: false, reason: 'empty' });
  });

  it('treats whitespace-only as empty', () => {
    expect(validateFiscalId('   ', 'NIF')).toEqual({ ok: false, reason: 'empty' });
  });

  it('treats null/undefined value as empty', () => {
    expect(validateFiscalId(null, 'NIF')).toEqual({ ok: false, reason: 'empty' });
    expect(validateFiscalId(undefined, 'NIF')).toEqual({ ok: false, reason: 'empty' });
  });

  it('accepts unknown code (no validator) without crashing', () => {
    expect(validateFiscalId('whatever-123', 'NEW_TYPE')).toEqual({ ok: true });
  });

  it('accepts when code is null/undefined', () => {
    expect(validateFiscalId('12345678Z', null)).toEqual({ ok: true });
    expect(validateFiscalId('12345678Z', undefined)).toEqual({ ok: true });
  });

  it('normalizes code casing', () => {
    expect(validateFiscalId('12345678Z', 'nif')).toEqual({ ok: true });
  });

  it('rejects values exceeding max length', () => {
    expect(validateFiscalId('X'.repeat(65), 'NIF')).toEqual({ ok: false, reason: 'format' });
  });
});

describe('normalizeFiscalId', () => {
  it('trims and uppercases', () => {
    expect(normalizeFiscalId('  12345678z  ')).toBe('12345678Z');
  });

  it('leaves dashes untouched', () => {
    expect(normalizeFiscalId('20-12345678-3')).toBe('20-12345678-3');
  });
});
