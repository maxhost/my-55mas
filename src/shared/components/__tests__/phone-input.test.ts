import { describe, it, expect } from 'vitest';
import { isValidE164 } from '../phone-input';

describe('isValidE164', () => {
  it('returns false for empty string', () => {
    expect(isValidE164('')).toBe(false);
  });

  it('validates a Spanish mobile number', () => {
    expect(isValidE164('+34612345678', 'ES')).toBe(true);
  });

  it('validates a Portuguese mobile number', () => {
    expect(isValidE164('+351912345678', 'PT')).toBe(true);
  });

  it('rejects malformed phone', () => {
    expect(isValidE164('+34abc', 'ES')).toBe(false);
  });

  it('rejects too-short number', () => {
    expect(isValidE164('+341', 'ES')).toBe(false);
  });
});
