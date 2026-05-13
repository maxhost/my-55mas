import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock next/headers per-test so we can drive the Host header.
let currentHost = '';
vi.mock('next/headers', () => ({
  headers: () => ({ get: (k: string) => (k === 'host' ? currentHost : null) }),
}));

import { getDomainCountry, DEFAULT_DOMAIN_COUNTRY } from '../domain';

afterEach(() => {
  currentHost = '';
});

describe('getDomainCountry', () => {
  it('returns ES for 55mas.es', () => {
    currentHost = '55mas.es';
    expect(getDomainCountry()).toBe('ES');
  });

  it('returns PT for 55mas.pt', () => {
    currentHost = '55mas.pt';
    expect(getDomainCountry()).toBe('PT');
  });

  it('returns FR for 55mas.fr', () => {
    currentHost = '55mas.fr';
    expect(getDomainCountry()).toBe('FR');
  });

  it('returns AR for 55mas.com.ar (longest-match check)', () => {
    currentHost = '55mas.com.ar';
    expect(getDomainCountry()).toBe('AR');
  });

  it('ignores trailing port', () => {
    currentHost = '55mas.es:3000';
    expect(getDomainCountry()).toBe('ES');
  });

  it('returns the default for an unknown TLD (e.g. preview URL)', () => {
    currentHost = 'something-preview.netlify.app';
    expect(getDomainCountry()).toBe(DEFAULT_DOMAIN_COUNTRY);
  });

  it('returns the default when no host header is present', () => {
    currentHost = '';
    expect(getDomainCountry()).toBe(DEFAULT_DOMAIN_COUNTRY);
  });
});
