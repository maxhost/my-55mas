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
  it('readAuth returns undefined when userId is null (signup flow)', async () => {
    const sb = {} as Sb;
    await expect(readAuth(sb, null)).resolves.toBeUndefined();
  });

  it('readAuth returns email from auth.getUser when userId matches', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'user-42', email: 'found@example.com' } },
      error: null,
    });
    const sb = { auth: { getUser } } as unknown as Sb;
    await expect(readAuth(sb, 'user-42')).resolves.toBe('found@example.com');
  });

  it('readAuth returns undefined when session id does not match userId (defensive)', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { id: 'other-user', email: 'x@y.z' } },
      error: null,
    });
    const sb = { auth: { getUser } } as unknown as Sb;
    await expect(readAuth(sb, 'user-42')).resolves.toBeUndefined();
  });

  // ── signup flow (currentUserId null) ────────────

  it('writeAuth (signup) throws when email is missing', async () => {
    const sb = {} as Sb;
    await expect(writeAuth(sb, { password: 'x' })).rejects.toThrow(
      PersistenceError
    );
  });

  it('writeAuth (signup) throws when password is missing', async () => {
    const sb = {} as Sb;
    await expect(writeAuth(sb, { email: 'a@b.c' })).rejects.toThrow(
      PersistenceError
    );
  });

  it('writeAuth (signup) throws when confirm_password does not match', async () => {
    const sb = {} as Sb;
    await expect(
      writeAuth(sb, {
        email: 'a@b.c',
        password: 'x',
        confirm_password: 'y',
      })
    ).rejects.toThrow(PersistenceError);
  });

  it('writeAuth (signup) calls signUp and returns userId on success', async () => {
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
    expect(result).toEqual({ userId: 'new-user-1', emailUpdateRequested: false });
    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@b.c', password: 'secret' })
    );
  });

  it('writeAuth (signup) surfaces supabase signUp error', async () => {
    const signUp = vi.fn().mockResolvedValue({
      data: { user: null },
      error: { message: 'email taken' },
    });
    const sb = { auth: { signUp } } as unknown as Sb;
    await expect(
      writeAuth(sb, { email: 'a@b.c', password: 'secret' })
    ).rejects.toThrow(/email taken/);
  });

  // ── edit flow (currentUserId presente) ──────────

  it('writeAuth (edit) is no-op when email unchanged', async () => {
    const signUp = vi.fn();
    const updateUser = vi.fn();
    const sb = { auth: { signUp, updateUser } } as unknown as Sb;
    const result = await writeAuth(
      sb,
      { email: 'same@example.com' },
      {
        currentUserId: 'u1',
        currentEmail: 'same@example.com',
        allowChange: true,
      }
    );
    expect(result).toEqual({ userId: 'u1', emailUpdateRequested: false });
    expect(signUp).not.toHaveBeenCalled();
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('writeAuth (edit) rejects change when allowChange=false', async () => {
    const updateUser = vi.fn();
    const sb = { auth: { updateUser } } as unknown as Sb;
    await expect(
      writeAuth(
        sb,
        { email: 'new@example.com' },
        {
          currentUserId: 'u1',
          currentEmail: 'old@example.com',
          allowChange: false,
        }
      )
    ).rejects.toThrow(/not allowed/);
    expect(updateUser).not.toHaveBeenCalled();
  });

  it('writeAuth (edit) calls updateUser when email changed + allowChange=true', async () => {
    const updateUser = vi
      .fn()
      .mockResolvedValue({ data: {}, error: null });
    const sb = { auth: { updateUser } } as unknown as Sb;
    const result = await writeAuth(
      sb,
      { email: 'new@example.com' },
      {
        currentUserId: 'u1',
        currentEmail: 'old@example.com',
        allowChange: true,
      }
    );
    expect(result).toEqual({ userId: 'u1', emailUpdateRequested: true });
    expect(updateUser).toHaveBeenCalledWith({ email: 'new@example.com' });
  });

  it('writeAuth (edit) surfaces supabase updateUser error', async () => {
    const updateUser = vi
      .fn()
      .mockResolvedValue({ data: {}, error: { message: 'rate limit' } });
    const sb = { auth: { updateUser } } as unknown as Sb;
    await expect(
      writeAuth(
        sb,
        { email: 'new@example.com' },
        {
          currentUserId: 'u1',
          currentEmail: 'old@example.com',
          allowChange: true,
        }
      )
    ).rejects.toThrow(/rate limit/);
  });
});
