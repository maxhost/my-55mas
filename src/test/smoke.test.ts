import { describe, it, expect } from 'vitest';
import { locales, defaultLocale } from '@/lib/i18n/config';

describe('smoke tests', () => {
  it('resolves path aliases', () => {
    expect(locales).toBeDefined();
    expect(Array.isArray(locales)).toBe(true);
  });

  it('has correct i18n defaults', () => {
    expect(defaultLocale).toBe('es');
    expect(locales).toContain('es');
    expect(locales).toContain('en');
    expect(locales).toContain('pt');
    expect(locales).toContain('fr');
    expect(locales).toContain('ca');
    expect(locales).toHaveLength(5);
  });
});
