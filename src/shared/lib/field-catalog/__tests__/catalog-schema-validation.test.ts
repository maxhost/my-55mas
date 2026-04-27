import { describe, it, expect } from 'vitest';
import {
  fieldDefinitionSchema,
  catalogFormSchemaSchema,
  validateCatalogFormSchema,
} from '../catalog-schema-validation';

const baseFieldDefinition = {
  id: '11111111-1111-1111-1111-111111111111',
  group_id: '22222222-2222-2222-2222-222222222222',
  key: 'phone',
  input_type: 'text' as const,
  options: null,
  options_source: null,
  sort_order: 0,
  is_active: true,
};

describe('fieldDefinitionSchema — persistence_type ↔ target discriminated union', () => {
  describe('db_column', () => {
    it('accepts valid target {table, column}', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'db_column',
        persistence_target: { table: 'profiles', column: 'phone' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects target missing column', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'db_column',
        persistence_target: { table: 'profiles' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('auth', () => {
    it('accepts valid target {auth_field: "email"}', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'auth',
        persistence_target: { auth_field: 'email' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects invalid auth_field value', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'auth',
        persistence_target: { auth_field: 'username' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('form_response', () => {
    it('accepts null target', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'form_response',
        persistence_target: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-null target', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'form_response',
        persistence_target: { foo: 'bar' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('survey', () => {
    it('accepts valid target {survey_question_key}', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'survey',
        persistence_target: { survey_question_key: 'experience_years' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty survey_question_key', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'survey',
        persistence_target: { survey_question_key: '' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('service_select', () => {
    it('accepts null target', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'service_select',
        persistence_target: null,
      });
      expect(result.success).toBe(true);
    });

    it('rejects non-null target', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'service_select',
        persistence_target: { some: 'data' },
      });
      expect(result.success).toBe(false);
    });
  });

  describe('subtype', () => {
    it('accepts valid target {subtype_group}', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'subtype',
        persistence_target: { subtype_group: 'cleaning' },
      });
      expect(result.success).toBe(true);
    });

    it('rejects empty subtype_group', () => {
      const result = fieldDefinitionSchema.safeParse({
        ...baseFieldDefinition,
        persistence_type: 'subtype',
        persistence_target: { subtype_group: '' },
      });
      expect(result.success).toBe(false);
    });
  });

  it('rejects unknown persistence_type', () => {
    const result = fieldDefinitionSchema.safeParse({
      ...baseFieldDefinition,
      persistence_type: 'unknown',
      persistence_target: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects invalid input_type', () => {
    const result = fieldDefinitionSchema.safeParse({
      ...baseFieldDefinition,
      input_type: 'file',
      persistence_type: 'form_response',
      persistence_target: null,
    });
    expect(result.success).toBe(false);
  });
});

describe('catalogFormSchemaSchema', () => {
  const validStep = {
    key: 'step1',
    field_refs: [
      {
        field_definition_id: '33333333-3333-3333-3333-333333333333',
        required: true,
      },
    ],
  };

  it('accepts a valid single-step schema', () => {
    expect(
      catalogFormSchemaSchema.safeParse({ steps: [validStep] }).success
    ).toBe(true);
  });

  it('accepts a step with empty field_refs + actions (actions-only step)', () => {
    expect(
      catalogFormSchemaSchema.safeParse({
        steps: [
          {
            key: 'confirm',
            field_refs: [],
            actions: [{ key: 'submitBtn', type: 'submit' }],
          },
        ],
      }).success
    ).toBe(true);
  });

  it('rejects empty steps array', () => {
    expect(catalogFormSchemaSchema.safeParse({ steps: [] }).success).toBe(false);
  });

  it('rejects invalid UUID in field_definition_id', () => {
    expect(
      catalogFormSchemaSchema.safeParse({
        steps: [
          {
            key: 'step1',
            field_refs: [{ field_definition_id: 'not-a-uuid', required: true }],
          },
        ],
      }).success
    ).toBe(false);
  });

  it('rejects invalid action type', () => {
    expect(
      catalogFormSchemaSchema.safeParse({
        steps: [
          {
            ...validStep,
            actions: [{ key: 'btn', type: 'foo' }],
          },
        ],
      }).success
    ).toBe(false);
  });

  it('rejects step without key', () => {
    expect(
      catalogFormSchemaSchema.safeParse({
        steps: [{ field_refs: [] }],
      }).success
    ).toBe(false);
  });
});

describe('validateCatalogFormSchema wrapper', () => {
  it('returns { ok: true, data } for valid input', () => {
    const result = validateCatalogFormSchema({
      steps: [
        {
          key: 'step1',
          field_refs: [
            {
              field_definition_id: '44444444-4444-4444-4444-444444444444',
              required: false,
            },
          ],
        },
      ],
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.steps).toHaveLength(1);
    }
  });

  it('returns { ok: false, errors } for invalid input', () => {
    const result = validateCatalogFormSchema({ steps: [] });
    expect(result.ok).toBe(false);
  });
});

describe('validateCatalogFormSchema — kind: talent-service guard', () => {
  const schemaWithRegister = {
    steps: [
      {
        key: 'step1',
        field_refs: [],
        actions: [{ key: 'btn1', type: 'register' as const }],
      },
    ],
  };

  const schemaWithSubmit = {
    steps: [
      {
        key: 'step1',
        field_refs: [],
        actions: [{ key: 'btn1', type: 'submit' as const }],
      },
    ],
  };

  it('accepts register action in registration context (default kind)', () => {
    expect(validateCatalogFormSchema(schemaWithRegister).ok).toBe(true);
    expect(
      validateCatalogFormSchema(schemaWithRegister, { kind: 'registration' }).ok
    ).toBe(true);
  });

  it('rejects register action in talent-service context', () => {
    const result = validateCatalogFormSchema(schemaWithRegister, {
      kind: 'talent-service',
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      const issues = result.errors.issues;
      expect(issues.some((i) => i.message.includes('register'))).toBe(true);
    }
  });

  it('accepts submit action in talent-service context', () => {
    expect(
      validateCatalogFormSchema(schemaWithSubmit, { kind: 'talent-service' }).ok
    ).toBe(true);
  });

  it('rejects register even when nested in any step', () => {
    const result = validateCatalogFormSchema(
      {
        steps: [
          { key: 's1', field_refs: [], actions: [{ key: 'b1', type: 'submit' }] },
          { key: 's2', field_refs: [], actions: [{ key: 'b2', type: 'register' }] },
        ],
      },
      { kind: 'talent-service' }
    );
    expect(result.ok).toBe(false);
  });
});
