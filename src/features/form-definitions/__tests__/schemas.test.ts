import { describe, it, expect } from 'vitest';
import { saveI18nSchema, saveActivationSchema } from '../schemas';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

describe('saveI18nSchema', () => {
  it('accepts empty i18n', () => {
    const result = saveI18nSchema.safeParse({ formId: validUuid, i18n: {} });
    expect(result.success).toBe(true);
  });

  it('accepts full talent_registration shape', () => {
    const result = saveI18nSchema.safeParse({
      formId: validUuid,
      i18n: {
        es: {
          title: 'Registro',
          submitLabel: 'Enviar',
          fields: {
            email: {
              label: 'Email',
              placeholder: 'tu@email.com',
              errors: { required: 'Obligatorio' },
            },
          },
        },
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid formId', () => {
    const result = saveI18nSchema.safeParse({ formId: 'not-uuid', i18n: {} });
    expect(result.success).toBe(false);
  });

  it('rejects unknown locale', () => {
    const result = saveI18nSchema.safeParse({
      formId: validUuid,
      i18n: { zz: { title: 'X' } },
    });
    expect(result.success).toBe(false);
  });
});

describe('saveActivationSchema', () => {
  it('accepts active form with countries', () => {
    const result = saveActivationSchema.safeParse({
      formId: validUuid,
      is_active: true,
      countryIds: [validUuid],
    });
    expect(result.success).toBe(true);
  });

  it('accepts inactive form with no countries', () => {
    const result = saveActivationSchema.safeParse({
      formId: validUuid,
      is_active: false,
      countryIds: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-uuid country', () => {
    const result = saveActivationSchema.safeParse({
      formId: validUuid,
      is_active: true,
      countryIds: ['nope'],
    });
    expect(result.success).toBe(false);
  });
});
