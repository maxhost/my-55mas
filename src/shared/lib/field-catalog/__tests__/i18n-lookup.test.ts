import { describe, it, expect } from 'vitest';
import { lookupMessage, snakeToCamel } from '../i18n-lookup';

describe('lookupMessage', () => {
  it('resolves nested key in ES locale', () => {
    expect(lookupMessage('DbColumnOptions.gender_male', 'es')).toBe('Masculino');
  });

  it('resolves same key in EN locale with distinct translation', () => {
    expect(lookupMessage('DbColumnOptions.gender_male', 'en')).toBe('Male');
  });

  it('falls back to ES when locale is missing the key', () => {
    // camelCase key existing only if we added it; this one exists in all 5
    // so we fake a fallback with an unknown locale.
    expect(lookupMessage('DbColumnOptions.gender_male', 'xx')).toBe(
      'Masculino'
    );
  });

  it('returns null for missing key in all locales', () => {
    expect(lookupMessage('DbColumnOptions.nonexistent_key', 'es')).toBeNull();
  });

  it('handles single-level (non-nested) keys', () => {
    // nothing at root we know of, should return null cleanly
    expect(lookupMessage('not_a_real_root_key', 'es')).toBeNull();
  });

  it('handles mismatched type (non-string leaf) as null', () => {
    // DbColumnOptions itself is an object, not a string — should return null.
    expect(lookupMessage('DbColumnOptions', 'es')).toBeNull();
  });
});

describe('snakeToCamel', () => {
  it('converts snake_case to camelCase', () => {
    expect(snakeToCamel('preferred_contact')).toBe('preferredContact');
    expect(snakeToCamel('professional_status')).toBe('professionalStatus');
  });

  it('leaves single-word identifiers unchanged', () => {
    expect(snakeToCamel('gender')).toBe('gender');
  });

  it('handles multi-underscore identifiers', () => {
    expect(snakeToCamel('a_b_c')).toBe('aBC');
  });
});
