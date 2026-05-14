import { describe, it, expect } from 'vitest';
import { lexicalStateSchema } from '../types';

describe('lexicalStateSchema', () => {
  it('accepts a minimal valid state', () => {
    const result = lexicalStateSchema.safeParse({
      root: { type: 'root', children: [] },
    });
    expect(result.success).toBe(true);
  });

  it('accepts state with extra keys (passthrough)', () => {
    const result = lexicalStateSchema.safeParse({
      root: { type: 'root', children: [] },
      version: 5,
      somethingNew: 'future-field',
    });
    expect(result.success).toBe(true);
  });

  it('rejects state without a root key', () => {
    expect(lexicalStateSchema.safeParse({}).success).toBe(false);
    expect(lexicalStateSchema.safeParse({ notRoot: {} }).success).toBe(false);
  });

  it('rejects non-object root', () => {
    expect(lexicalStateSchema.safeParse({ root: 'string' }).success).toBe(false);
    expect(lexicalStateSchema.safeParse({ root: null }).success).toBe(false);
    expect(lexicalStateSchema.safeParse({ root: 42 }).success).toBe(false);
  });

  it('rejects null and primitive inputs', () => {
    expect(lexicalStateSchema.safeParse(null).success).toBe(false);
    expect(lexicalStateSchema.safeParse('html string').success).toBe(false);
  });
});
