import { describe, it, expect, vi } from 'vitest';
import { isUserOwnedTable, PersistenceError } from '../persistence/context';
import { readDbColumn, writeDbColumn } from '../persistence/db-column';
import { readAuth, writeAuth } from '../persistence/auth';
import type { Sb } from '../persistence/context';

// ── context.isUserOwnedTable ──────────────────────

describe('isUserOwnedTable', () => {
  it('accepts profiles, talent_profiles, client_profiles', () => {
    expect(isUserOwnedTable('profiles')).toBe(true);
    expect(isUserOwnedTable('talent_profiles')).toBe(true);
    expect(isUserOwnedTable('client_profiles')).toBe(true);
  });

  it('rejects orders (out of scope v1)', () => {
    expect(isUserOwnedTable('orders')).toBe(false);
  });

  it('rejects auth (uses auth adapter, not db_column)', () => {
    expect(isUserOwnedTable('auth')).toBe(false);
  });
});

// ── db-column: unsupported table path ─────────────

describe('db-column adapter — table gating', () => {
  const sb = {} as Sb;

  it('readDbColumn throws for unsupported table', async () => {
    await expect(
      readDbColumn(sb, 'user-1', { table: 'orders', column: 'notes' })
    ).rejects.toThrow(PersistenceError);
  });

  it('writeDbColumn throws for unsupported table', async () => {
    await expect(
      writeDbColumn(sb, 'user-1', 'value', { table: 'orders', column: 'notes' })
    ).rejects.toThrow(PersistenceError);
  });
});

// ── auth adapter ──────────────────────────────────

describe('auth adapter', () => {
  it('readAuth always returns undefined (no pre-fill)', async () => {
    await expect(readAuth()).resolves.toBeUndefined();
  });

  it('writeAuth throws when email is missing', async () => {
    const sb = {} as Sb;
    await expect(writeAuth(sb, { password: 'x' })).rejects.toThrow(
      PersistenceError
    );
  });

  it('writeAuth throws when password is missing', async () => {
    const sb = {} as Sb;
    await expect(writeAuth(sb, { email: 'a@b.c' })).rejects.toThrow(
      PersistenceError
    );
  });

  it('writeAuth throws when confirm_password does not match', async () => {
    const sb = {} as Sb;
    await expect(
      writeAuth(sb, {
        email: 'a@b.c',
        password: 'x',
        confirm_password: 'y',
      })
    ).rejects.toThrow(PersistenceError);
  });

  it('writeAuth calls signUp and returns userId on success', async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: { id: 'new-user-1' } },
      error: null,
    });
    const sb = { auth: { signUp } } as unknown as Sb;
    const result = await writeAuth(sb, {
      email: 'a@b.c',
      password: 'secret',
      confirm_password: 'secret',
    });
    expect(result).toEqual({ userId: 'new-user-1' });
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@b.c', password: 'secret' })
    );
  });

  it('writeAuth surfaces supabase signUp error', async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'email taken' },
    });
    const sb = { auth: { signUp } } as unknown as Sb;
    await expect(
      writeAuth(sb, { email: 'a@b.c', password: 'secret' })
    ).rejects.toThrow(/email taken/);
  });
});
