import { describe, it, expect } from 'vitest';
import { autoMatchColumns } from '../lib/column-matcher';
import type { DbColumn } from '../types';

const dbColumns: DbColumn[] = [
  { name: 'full_name', required: true },
  { name: 'email', required: true },
  { name: 'phone', required: false },
  { name: 'city', required: false },
  { name: 'status', required: false },
];

describe('autoMatchColumns', () => {
  it('matches exact names', () => {
    const result = autoMatchColumns(['email', 'phone'], dbColumns);

    expect(result).toEqual([
      { csvColumn: 'email', dbColumn: 'email' },
      { csvColumn: 'phone', dbColumn: 'phone' },
    ]);
  });

  it('matches by alias (nombre → full_name)', () => {
    const result = autoMatchColumns(['nombre'], dbColumns);

    expect(result[0].dbColumn).toBe('full_name');
  });

  it('matches partial contains (Email → email)', () => {
    const result = autoMatchColumns(['Email Address'], dbColumns);

    expect(result[0].dbColumn).toBe('email');
  });

  it('returns null for unmatched columns', () => {
    const result = autoMatchColumns(['unknown_column'], dbColumns);

    expect(result[0].dbColumn).toBeNull();
  });

  it('does not reuse a DB column for multiple CSV columns', () => {
    const result = autoMatchColumns(['email', 'Email Address'], dbColumns);

    const emailMatches = result.filter((r) => r.dbColumn === 'email');
    expect(emailMatches.length).toBe(1);
  });

  it('matches Portuguese aliases (telefone → phone)', () => {
    const result = autoMatchColumns(['telefone', 'ciudad'], dbColumns);

    expect(result[0].dbColumn).toBe('phone');
    expect(result[1].dbColumn).toBe('city');
  });

  it('handles empty CSV headers', () => {
    const result = autoMatchColumns([], dbColumns);

    expect(result).toEqual([]);
  });
});
