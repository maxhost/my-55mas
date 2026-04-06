import { describe, it, expect } from 'vitest';
import { formFieldSchema, formSchemaSchema } from '../schemas';

// ── db_column field type ────────────────────────────

describe('formFieldSchema — db_column type', () => {
  it('accepts valid db_column field with table and column', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_1',
      type: 'db_column',
      required: true,
      db_table: 'talent_profiles',
      db_column: 'birth_date',
    });
    expect(result.success).toBe(true);
  });

  it('accepts db_column field with select column (options auto-populated)', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_2',
      type: 'db_column',
      required: false,
      db_table: 'talent_profiles',
      db_column: 'gender',
      options: ['male', 'female', 'other', 'prefer_not_to_say'],
    });
    expect(result.success).toBe(true);
  });

  it('rejects db_column without db_table', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_1',
      type: 'db_column',
      required: true,
      db_column: 'birth_date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects db_column without db_column', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_1',
      type: 'db_column',
      required: true,
      db_table: 'talent_profiles',
    });
    expect(result.success).toBe(false);
  });

  it('rejects db_column with invalid table', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_1',
      type: 'db_column',
      required: true,
      db_table: 'nonexistent_table',
      db_column: 'birth_date',
    });
    expect(result.success).toBe(false);
  });

  it('rejects db_column with invalid column for table', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_1',
      type: 'db_column',
      required: true,
      db_table: 'talent_profiles',
      db_column: 'nonexistent_column',
    });
    expect(result.success).toBe(false);
  });

  it('ignores db_table and db_column on non-db_column types', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_1',
      type: 'text',
      required: false,
      db_table: 'talent_profiles',
      db_column: 'birth_date',
    });
    expect(result.success).toBe(true);
  });
});

describe('formSchemaSchema — db_column duplicate detection', () => {
  it('rejects duplicate db_column mapping in same form', () => {
    const result = formSchemaSchema.safeParse({
      steps: [
        {
          key: 'step_1',
          fields: [
            { key: 'field_1', type: 'db_column', required: true, db_table: 'talent_profiles', db_column: 'birth_date' },
            { key: 'field_2', type: 'db_column', required: false, db_table: 'talent_profiles', db_column: 'birth_date' },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it('allows same column in different tables', () => {
    const result = formSchemaSchema.safeParse({
      steps: [
        {
          key: 'step_1',
          fields: [
            { key: 'field_1', type: 'db_column', required: true, db_table: 'profiles', db_column: 'full_name' },
            { key: 'field_2', type: 'db_column', required: false, db_table: 'talent_profiles', db_column: 'address' },
          ],
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it('accepts auth.email as valid db_column', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_1',
      type: 'db_column',
      required: true,
      db_table: 'auth',
      db_column: 'email',
    });
    expect(result.success).toBe(true);
  });

  it('accepts auth.password as valid db_column', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_2',
      type: 'db_column',
      required: true,
      db_table: 'auth',
      db_column: 'password',
    });
    expect(result.success).toBe(true);
  });

  it('accepts auth.confirm_password as valid db_column', () => {
    const result = formFieldSchema.safeParse({
      key: 'step_1_field_3',
      type: 'db_column',
      required: true,
      db_table: 'auth',
      db_column: 'confirm_password',
    });
    expect(result.success).toBe(true);
  });

  it('detects duplicates across steps', () => {
    const result = formSchemaSchema.safeParse({
      steps: [
        {
          key: 'step_1',
          fields: [
            { key: 'field_1', type: 'db_column', required: true, db_table: 'profiles', db_column: 'full_name' },
          ],
        },
        {
          key: 'step_2',
          fields: [
            { key: 'field_2', type: 'db_column', required: true, db_table: 'profiles', db_column: 'full_name' },
          ],
        },
      ],
    });
    expect(result.success).toBe(false);
  });
});
