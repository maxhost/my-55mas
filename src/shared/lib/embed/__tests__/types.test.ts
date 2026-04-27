import { describe, it, expect } from 'vitest';
import { EMBED_REASONS, isEmbedReason } from '../types';
import type { EmbedReason, EmbedResolverResult } from '../types';

describe('EMBED_REASONS', () => {
  it('contains the 10 documented reasons', () => {
    expect(EMBED_REASONS).toEqual([
      'unknown-slug',
      'service-not-active',
      'country-mismatch',
      'talent-country-not-set',
      'city-not-configured',
      'no-active-form',
      'empty-schema',
      'legacy-schema',
      'not-authenticated',
      'no-talent-profile',
    ]);
  });
});

describe('isEmbedReason', () => {
  it('returns true for valid reasons', () => {
    expect(isEmbedReason('unknown-slug')).toBe(true);
    expect(isEmbedReason('country-mismatch')).toBe(true);
    expect(isEmbedReason('legacy-schema')).toBe(true);
  });

  it('returns false for invalid strings', () => {
    expect(isEmbedReason('not-a-reason')).toBe(false);
    expect(isEmbedReason('')).toBe(false);
    expect(isEmbedReason('UNKNOWN-SLUG')).toBe(false);
  });

  it('returns false for non-string inputs', () => {
    expect(isEmbedReason(undefined)).toBe(false);
    expect(isEmbedReason(null)).toBe(false);
    expect(isEmbedReason(42)).toBe(false);
  });
});

// EmbedResolverResult es type-only — verificamos shape via construcciones.
describe('EmbedResolverResult shape', () => {
  it('available branch carries resolvedForm + meta', () => {
    type Meta = { formId: string; serviceId: string };
    const result: EmbedResolverResult<Meta> = {
      available: true,
      resolvedForm: { steps: [] },
      meta: { formId: 'f1', serviceId: 's1' },
    };
    expect(result.available).toBe(true);
    if (result.available) {
      expect(result.meta.formId).toBe('f1');
    }
  });

  it('unavailable branch carries reason', () => {
    type Meta = { formId: string };
    const result: EmbedResolverResult<Meta> = {
      available: false,
      reason: 'unknown-slug',
    };
    expect(result.available).toBe(false);
    if (!result.available) {
      const reason: EmbedReason = result.reason;
      expect(reason).toBe('unknown-slug');
    }
  });
});
