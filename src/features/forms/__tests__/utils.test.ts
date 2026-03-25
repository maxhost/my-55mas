import { describe, it, expect } from 'vitest';
import { sanitizeKey } from '../utils';

describe('sanitizeKey', () => {
  it('converts to lowercase', () => {
    expect(sanitizeKey('MiCampo')).toBe('micampo');
  });

  it('replaces spaces with underscores', () => {
    expect(sanitizeKey('hello world')).toBe('hello_world');
  });

  it('strips all leading non-letters', () => {
    expect(sanitizeKey('123abc')).toBe('abc');
  });

  it('strips leading underscores', () => {
    expect(sanitizeKey('___test')).toBe('test');
  });

  it('returns empty for all-numbers input', () => {
    expect(sanitizeKey('123')).toBe('');
  });

  it('returns empty for empty input', () => {
    expect(sanitizeKey('')).toBe('');
  });

  it('keeps valid snake_case unchanged', () => {
    expect(sanitizeKey('my_field_1')).toBe('my_field_1');
  });

  it('replaces accented characters', () => {
    expect(sanitizeKey('dirección')).toBe('direcci_n');
  });

  it('handles mixed invalid characters', () => {
    expect(sanitizeKey('Hello-World 2!')).toBe('hello_world_2_');
  });
});
