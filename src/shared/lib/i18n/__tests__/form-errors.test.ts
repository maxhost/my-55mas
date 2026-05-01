import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { buildFieldErrorMap, resolveFieldError } from '../form-errors';

describe('resolveFieldError', () => {
  const fields = {
    email: {
      errors: { required: 'Email obligatorio', invalid: 'Email inválido' },
    },
    password: {
      errors: { minLength: 'Mínimo 8 caracteres' },
    },
  };

  it('maps too_small zod issue to minLength i18n key', () => {
    const issue = { code: 'too_small', path: ['password'], message: 'too short' } as any;
    expect(resolveFieldError('password', issue, fields)).toBe('Mínimo 8 caracteres');
  });

  it('maps invalid_string zod issue to invalid i18n key', () => {
    const issue = { code: 'invalid_string', path: ['email'], message: 'bad email' } as any;
    expect(resolveFieldError('email', issue, fields)).toBe('Email inválido');
  });

  it('falls back from missing key to invalid in same field', () => {
    const issue = { code: 'too_small', path: ['email'], message: 'fallback' } as any;
    // email has no minLength key, falls back to invalid
    expect(resolveFieldError('email', issue, fields)).toBe('Email inválido');
  });

  it('falls back to issue.message when nothing matches in i18n', () => {
    const issue = { code: 'custom', path: ['unknown_field'], message: 'raw' } as any;
    expect(resolveFieldError('unknown_field', issue, fields)).toBe('raw');
  });

  it('returns null when no issue', () => {
    expect(resolveFieldError('email', undefined, fields)).toBeNull();
  });
});

describe('buildFieldErrorMap', () => {
  it('builds a map from Zod issues using i18n', () => {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    const result = schema.safeParse({ email: 'bad', password: '123' });
    expect(result.success).toBe(false);
    if (result.success) return;

    const fields = {
      email: { errors: { invalid: 'Email inválido' } },
      password: { errors: { minLength: 'Mín 8' } },
    };
    const map = buildFieldErrorMap(result.error.issues, fields);
    expect(map.email).toBe('Email inválido');
    expect(map.password).toBe('Mín 8');
  });

  it('takes the first issue per field', () => {
    const issues = [
      { code: 'invalid_type', path: ['x'], message: 'a' } as any,
      { code: 'invalid_type', path: ['x'], message: 'b' } as any,
    ];
    const map = buildFieldErrorMap(issues, { x: { errors: { required: 'first' } } });
    expect(map.x).toBe('first');
  });
});
