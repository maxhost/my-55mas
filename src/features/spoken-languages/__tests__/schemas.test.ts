import { describe, it, expect } from 'vitest';
import {
  spokenLanguageCodeSchema,
  spokenLanguageInputSchema,
  saveSpokenLanguageSchema,
} from '../schemas';

const fullTranslations = { es: 'a', en: 'b', pt: 'c', fr: 'd', ca: 'e' };

describe('spokenLanguageCodeSchema', () => {
  it.each(['pt', 'en', 'yue', 'zh-hk', 'pt-br'])('accepts %s', (code) => {
    expect(spokenLanguageCodeSchema.safeParse(code).success).toBe(true);
  });

  it.each(['PT', 'portuguese', 'p', '', 'pt-HK', 'pt_hk', 'Zh-hk'])(
    'rejects %s',
    (code) => {
      expect(spokenLanguageCodeSchema.safeParse(code).success).toBe(false);
    }
  );
});

describe('spokenLanguageInputSchema', () => {
  const baseValid = {
    code: 'pt',
    sort_order: 0,
    is_active: true,
    translations: fullTranslations,
    creating: true,
  };

  it('accepts a full valid input', () => {
    expect(spokenLanguageInputSchema.safeParse(baseValid).success).toBe(true);
  });

  it('accepts creating=false (edit mode)', () => {
    expect(
      spokenLanguageInputSchema.safeParse({ ...baseValid, creating: false }).success
    ).toBe(true);
  });

  it('rejects when a locale translation is missing', () => {
    const { pt: _pt, ...rest } = fullTranslations;
    void _pt;
    const result = spokenLanguageInputSchema.safeParse({
      ...baseValid,
      translations: rest,
    });
    expect(result.success).toBe(false);
  });

  it('rejects when a translation is an empty string', () => {
    const result = spokenLanguageInputSchema.safeParse({
      ...baseValid,
      translations: { ...fullTranslations, en: '' },
    });
    expect(result.success).toBe(false);
  });

  it('rejects negative sort_order', () => {
    expect(
      spokenLanguageInputSchema.safeParse({ ...baseValid, sort_order: -1 }).success
    ).toBe(false);
  });

  it('rejects invalid code', () => {
    expect(
      spokenLanguageInputSchema.safeParse({ ...baseValid, code: 'Portuguese' }).success
    ).toBe(false);
  });
});

describe('saveSpokenLanguageSchema', () => {
  it('accepts wrapped input', () => {
    const result = saveSpokenLanguageSchema.safeParse({
      language: {
        code: 'en',
        sort_order: 0,
        is_active: true,
        translations: fullTranslations,
        creating: true,
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects missing language', () => {
    expect(saveSpokenLanguageSchema.safeParse({}).success).toBe(false);
  });
});
