import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { devWarn } from '../dev-warn';

describe('devWarn', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it('logs in development with prefixed component name', () => {
    vi.stubEnv('NODE_ENV', 'development');
    devWarn('TalentServiceFormEmbed', { reason: 'unknown-slug' });
    expect(warnSpy).toHaveBeenCalledWith('[TalentServiceFormEmbed]', {
      reason: 'unknown-slug',
    });
  });

  it('logs in test mode (vitest sets NODE_ENV=test)', () => {
    vi.stubEnv('NODE_ENV', 'test');
    devWarn('Foo', 'bar');
    expect(warnSpy).toHaveBeenCalledWith('[Foo]', 'bar');
  });

  it('does NOT log in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    devWarn('Foo', { reason: 'whatever' });
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('passes through multiple payload args', () => {
    vi.stubEnv('NODE_ENV', 'development');
    devWarn('Foo', 'a', 1, { x: true });
    expect(warnSpy).toHaveBeenCalledWith('[Foo]', 'a', 1, { x: true });
  });
});
