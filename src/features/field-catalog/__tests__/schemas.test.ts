import { describe, it, expect } from 'vitest';
import {
  fieldGroupInputSchema,
  fieldDefinitionInputSchema,
} from '../schemas';

const fullGroupTranslations = {
  es: 'Registro',
  en: 'Registration',
  pt: 'Registo',
  fr: 'Inscription',
  ca: 'Registre',
};

const emptyFieldTrEntry = {
  label: 'Phone',
  placeholder: '',
  description: '',
  option_labels: null,
};
const fullFieldTranslations = {
  es: { ...emptyFieldTrEntry, label: 'Teléfono' },
  en: { ...emptyFieldTrEntry, label: 'Phone' },
  pt: { ...emptyFieldTrEntry, label: 'Telefone' },
  fr: { ...emptyFieldTrEntry, label: 'Téléphone' },
  ca: { ...emptyFieldTrEntry, label: 'Telèfon' },
};

const baseGroup = {
  id: null,
  slug: 'registration',
  sort_order: 0,
  is_active: true,
  translations: fullGroupTranslations,
};

const baseDefinition = {
  id: null,
  group_id: '11111111-1111-1111-1111-111111111111',
  key: 'phone',
  input_type: 'text' as const,
  options: null,
  options_source: null,
  sort_order: 0,
  is_active: true,
  translations: fullFieldTranslations,
};

describe('fieldGroupInputSchema', () => {
  it('accepts valid input with all locales', () => {
    expect(fieldGroupInputSchema.safeParse(baseGroup).success).toBe(true);
  });

  it('rejects slug with uppercase or spaces', () => {
    expect(
      fieldGroupInputSchema.safeParse({ ...baseGroup, slug: 'Registration' }).success
    ).toBe(false);
    expect(
      fieldGroupInputSchema.safeParse({ ...baseGroup, slug: 'my group' }).success
    ).toBe(false);
  });

  it('rejects when a locale translation is empty', () => {
    expect(
      fieldGroupInputSchema.safeParse({
        ...baseGroup,
        translations: { ...fullGroupTranslations, pt: '' },
      }).success
    ).toBe(false);
  });

  it('accepts edit mode (id present)', () => {
    expect(
      fieldGroupInputSchema.safeParse({
        ...baseGroup,
        id: '22222222-2222-2222-2222-222222222222',
      }).success
    ).toBe(true);
  });
});

describe('fieldDefinitionInputSchema — discriminated union', () => {
  it('accepts db_column with valid target', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      persistence_type: 'db_column',
      persistence_target: { table: 'profiles', column: 'phone' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects db_column with wrong target shape', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      persistence_type: 'db_column',
      persistence_target: { subtype_group: 'x' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts form_response with null target', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      persistence_type: 'form_response',
      persistence_target: null,
    });
    expect(result.success).toBe(true);
  });

  it('rejects form_response with non-null target', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      persistence_type: 'form_response',
      persistence_target: { foo: 'bar' },
    });
    expect(result.success).toBe(false);
  });

  it('accepts subtype with valid target', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'multiselect',
      persistence_type: 'subtype',
      persistence_target: { subtype_group: 'cleaning_areas' },
    });
    expect(result.success).toBe(true);
  });

  it('rejects invalid input_type (file)', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'file',
      persistence_type: 'form_response',
      persistence_target: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects key with uppercase', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      key: 'PhoneNumber',
      persistence_type: 'form_response',
      persistence_target: null,
    });
    expect(result.success).toBe(false);
  });

  it('rejects when a required locale label is empty', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      persistence_type: 'form_response',
      persistence_target: null,
      translations: {
        ...fullFieldTranslations,
        es: { ...emptyFieldTrEntry, label: '' },
      },
    });
    expect(result.success).toBe(false);
  });
});
