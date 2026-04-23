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
  config: null,
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

  it('rejects when es translation is empty (required fallback)', () => {
    expect(
      fieldGroupInputSchema.safeParse({
        ...baseGroup,
        translations: { ...fullGroupTranslations, es: '' },
      }).success
    ).toBe(false);
  });

  it('accepts when a non-es translation is empty', () => {
    expect(
      fieldGroupInputSchema.safeParse({
        ...baseGroup,
        translations: { ...fullGroupTranslations, pt: '' },
      }).success
    ).toBe(true);
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
      input_type: 'multiselect_checkbox',
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

  it('rejects when es label is empty (required fallback)', () => {
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

  it('accepts when a non-es label is empty', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      persistence_type: 'form_response',
      persistence_target: null,
      translations: {
        ...fullFieldTranslations,
        en: { ...emptyFieldTrEntry, label: '' },
      },
    });
    expect(result.success).toBe(true);
  });

  // display_text: description reemplaza a label como el campo requerido en ES.
  it('accepts display_text with empty label when es.description is set', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'display_text',
      persistence_type: 'none',
      persistence_target: null,
      translations: {
        ...fullFieldTranslations,
        es: { ...emptyFieldTrEntry, label: '', description: 'Texto legal...' },
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects display_text when es.description is empty', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'display_text',
      persistence_type: 'none',
      persistence_target: null,
      translations: {
        ...fullFieldTranslations,
        es: { ...emptyFieldTrEntry, label: 'Solo título', description: '' },
      },
    });
    expect(result.success).toBe(false);
  });

  // terms_checkbox: al menos una URL + URLs válidas
  it('accepts terms_checkbox with only tos_url', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'terms_checkbox',
      persistence_type: 'form_response',
      persistence_target: null,
      config: { tos_url: 'https://example.com/tos' },
    });
    expect(result.success).toBe(true);
  });

  it('accepts terms_checkbox with both urls', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'terms_checkbox',
      persistence_type: 'form_response',
      persistence_target: null,
      config: {
        tos_url: 'https://example.com/tos',
        privacy_url: 'https://example.com/privacy',
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects terms_checkbox without any url', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'terms_checkbox',
      persistence_type: 'form_response',
      persistence_target: null,
      config: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects terms_checkbox with invalid url scheme', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'terms_checkbox',
      persistence_type: 'form_response',
      persistence_target: null,
      config: { tos_url: 'ftp://example.com/tos' },
    });
    expect(result.success).toBe(false);
  });

  // config.allow_change: solo válido en email + auth
  it('accepts config.allow_change=true for email + auth', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'email',
      persistence_type: 'auth',
      persistence_target: { auth_field: 'email' },
      config: { allow_change: true },
    });
    expect(result.success).toBe(true);
  });

  it('accepts config.allow_change=false for any input_type', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'text',
      persistence_type: 'form_response',
      persistence_target: null,
      config: { allow_change: false },
    });
    expect(result.success).toBe(true);
  });

  it('rejects config.allow_change=true on non-email auth field', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'text',
      persistence_type: 'form_response',
      persistence_target: null,
      config: { allow_change: true },
    });
    expect(result.success).toBe(false);
  });

  it('rejects config.allow_change with non-boolean value', () => {
    const result = fieldDefinitionInputSchema.safeParse({
      ...baseDefinition,
      input_type: 'email',
      persistence_type: 'auth',
      persistence_target: { auth_field: 'email' },
      config: { allow_change: 'yes' },
    });
    expect(result.success).toBe(false);
  });
});
