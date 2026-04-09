import { describe, it, expect } from 'vitest';
import { parseCSVString } from '../lib/csv-parser';

describe('parseCSVString', () => {
  it('parses comma-separated CSV', () => {
    const csv = 'name,email\nJohn,john@test.com\nJane,jane@test.com';
    const result = parseCSVString(csv);

    expect(result.headers).toEqual(['name', 'email']);
    expect(result.totalRows).toBe(2);
    expect(result.rows[0]).toEqual({ name: 'John', email: 'john@test.com' });
    expect(result.delimiter).toBe(',');
  });

  it('parses semicolon-separated CSV', () => {
    const csv = 'nombre;email\nJuan;juan@test.com';
    const result = parseCSVString(csv);

    expect(result.headers).toEqual(['nombre', 'email']);
    expect(result.totalRows).toBe(1);
    expect(result.delimiter).toBe(';');
  });

  it('skips empty lines', () => {
    const csv = 'name,email\nJohn,john@test.com\n\nJane,jane@test.com\n';
    const result = parseCSVString(csv);

    expect(result.totalRows).toBe(2);
  });

  it('handles quoted fields with commas', () => {
    const csv = 'name,address\nJohn,"Street 1, City"\nJane,"Street 2, Town"';
    const result = parseCSVString(csv);

    expect(result.rows[0].address).toBe('Street 1, City');
  });

  it('returns empty for header-only CSV', () => {
    const csv = 'name,email';
    const result = parseCSVString(csv);

    expect(result.headers).toEqual(['name', 'email']);
    expect(result.totalRows).toBe(0);
    expect(result.rows).toEqual([]);
  });
});
