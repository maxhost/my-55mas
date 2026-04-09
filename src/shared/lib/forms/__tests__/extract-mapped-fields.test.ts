import { describe, it, expect } from 'vitest';
import { extractMappedFields } from '../extract-mapped-fields';
import type { FormSchema } from '../types';

// ── Helpers ──────────────────────────────────────────

function dbField(key: string, table: string, column: string) {
  return { key, type: 'db_column' as const, required: true, db_table: table, db_column: column };
}

function textField(key: string) {
  return { key, type: 'text' as const, required: false };
}

// ── extractMappedFields ──────────────────────────────

describe('extractMappedFields', () => {
  it('extracts fields grouped by table', () => {
    const schema: FormSchema = {
      steps: [
        {
          key: 'step_1',
          fields: [
            dbField('f1', 'profiles', 'full_name'),
            dbField('f2', 'profiles', 'birth_date'),
            dbField('f3', 'profiles', 'phone'),
          ],
        },
      ],
    };

    const formData = { f1: 'Juan García', f2: '1965-03-15', f3: '+34600111222' };
    const result = extractMappedFields(schema, formData);

    expect(result.profiles).toEqual({ full_name: 'Juan García', birth_date: '1965-03-15', phone: '+34600111222' });
  });

  it('puts non-db_column fields into unmapped', () => {
    const schema: FormSchema = {
      steps: [
        {
          key: 'step_1',
          fields: [
            dbField('f1', 'profiles', 'full_name'),
            textField('f2'),
            textField('f3'),
          ],
        },
      ],
    };

    const formData = { f1: 'Ana', f2: 'some text', f3: 'other' };
    const result = extractMappedFields(schema, formData);

    expect(result.profiles).toEqual({ full_name: 'Ana' });
    expect(result.unmapped).toEqual({ f2: 'some text', f3: 'other' });
  });

  it('returns empty tables when no db_column fields', () => {
    const schema: FormSchema = {
      steps: [
        { key: 'step_1', fields: [textField('f1'), textField('f2')] },
      ],
    };

    const formData = { f1: 'hello', f2: 'world' };
    const result = extractMappedFields(schema, formData);

    expect(result.unmapped).toEqual({ f1: 'hello', f2: 'world' });
    expect(result.profiles).toBeUndefined();
    expect(result.talent_profiles).toBeUndefined();
  });

  it('omits db_column fields with undefined/null values', () => {
    const schema: FormSchema = {
      steps: [
        {
          key: 'step_1',
          fields: [
            dbField('f1', 'profiles', 'full_name'),
            dbField('f2', 'profiles', 'phone'),
          ],
        },
      ],
    };

    const formData = { f1: 'Ana' }; // f2 not in formData
    const result = extractMappedFields(schema, formData);

    expect(result.profiles).toEqual({ full_name: 'Ana' });
    // phone not included because f2 has no value
  });

  it('handles fields across multiple steps', () => {
    const schema: FormSchema = {
      steps: [
        { key: 'step_1', fields: [dbField('f1', 'profiles', 'full_name')] },
        { key: 'step_2', fields: [dbField('f2', 'talent_profiles', 'address')] },
      ],
    };

    const formData = { f1: 'Pedro', f2: 'Calle Mayor 5' };
    const result = extractMappedFields(schema, formData);

    expect(result.profiles).toEqual({ full_name: 'Pedro' });
    expect(result.talent_profiles).toEqual({ address: 'Calle Mayor 5' });
  });

  it('includes boolean false values (not omitted)', () => {
    const schema: FormSchema = {
      steps: [
        { key: 'step_1', fields: [dbField('f1', 'talent_profiles', 'has_car')] },
      ],
    };

    const formData = { f1: false };
    const result = extractMappedFields(schema, formData);

    expect(result.talent_profiles).toEqual({ has_car: false });
  });

  it('includes empty string values (not omitted)', () => {
    const schema: FormSchema = {
      steps: [
        { key: 'step_1', fields: [dbField('f1', 'profiles', 'full_name')] },
      ],
    };

    const formData = { f1: '' };
    const result = extractMappedFields(schema, formData);

    expect(result.profiles).toEqual({ full_name: '' });
  });

  it('ignores fields with db_table/db_column but wrong type', () => {
    const schema: FormSchema = {
      steps: [
        {
          key: 'step_1',
          fields: [
            // A text field that happens to have db_table/db_column (shouldn't happen but defensive)
            { key: 'f1', type: 'text', required: false, db_table: 'profiles', db_column: 'full_name' },
          ],
        },
      ],
    };

    const formData = { f1: 'test' };
    const result = extractMappedFields(schema, formData);

    expect(result.profiles).toBeUndefined();
    expect(result.unmapped).toEqual({ f1: 'test' });
  });

  it('extracts auth fields (email, password, confirm_password)', () => {
    const schema: FormSchema = {
      steps: [
        {
          key: 'step_1',
          fields: [
            dbField('f1', 'auth', 'email'),
            dbField('f2', 'auth', 'password'),
            dbField('f3', 'auth', 'confirm_password'),
            dbField('f4', 'profiles', 'full_name'),
          ],
        },
      ],
    };

    const formData = { f1: 'user@example.com', f2: 'secret123', f3: 'secret123', f4: 'Juan' };
    const result = extractMappedFields(schema, formData);

    expect(result.auth).toEqual({
      email: 'user@example.com',
      password: 'secret123',
      confirm_password: 'secret123',
    });
    expect(result.profiles).toEqual({ full_name: 'Juan' });
    expect(result.unmapped).toEqual({});
  });
});
