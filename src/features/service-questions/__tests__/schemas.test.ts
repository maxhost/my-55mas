import { describe, it, expect } from 'vitest';
import { questionSchema, saveQuestionsSchema } from '../schemas';

const validUuid = '550e8400-e29b-41d4-a716-446655440000';

describe('questionSchema', () => {
  it('accepts a simple text question', () => {
    expect(
      questionSchema.safeParse({
        key: 'notas',
        type: 'text',
        required: false,
        i18n: { es: { label: 'Notas' } },
      }).success,
    ).toBe(true);
  });

  it('accepts a singleSelect with manual options', () => {
    expect(
      questionSchema.safeParse({
        key: 'tipo',
        type: 'singleSelect',
        required: true,
        i18n: { es: { label: 'Tipo' } },
        optionsSource: 'manual',
        options: [{ value: 'a', i18n: { es: { label: 'A' } } }],
      }).success,
    ).toBe(true);
  });

  it('rejects a singleSelect without optionsSource', () => {
    expect(
      questionSchema.safeParse({
        key: 'tipo',
        type: 'singleSelect',
        required: true,
        i18n: {},
      }).success,
    ).toBe(false);
  });

  it('rejects manual options when none provided', () => {
    expect(
      questionSchema.safeParse({
        key: 'tipo',
        type: 'multiSelect',
        required: true,
        i18n: {},
        optionsSource: 'manual',
        options: [],
      }).success,
    ).toBe(false);
  });

  it('accepts a subtype-source with group slug', () => {
    expect(
      questionSchema.safeParse({
        key: 'tipo',
        type: 'multiSelect',
        required: true,
        i18n: {},
        optionsSource: 'subtype',
        subtypeGroupSlug: 'electricidad',
        subtypeExcludedIds: [],
      }).success,
    ).toBe(true);
  });

  it('rejects subtype source without group slug', () => {
    expect(
      questionSchema.safeParse({
        key: 'tipo',
        type: 'multiSelect',
        required: true,
        i18n: {},
        optionsSource: 'subtype',
      }).success,
    ).toBe(false);
  });

  it('accepts file with config', () => {
    expect(
      questionSchema.safeParse({
        key: 'foto',
        type: 'file',
        required: false,
        i18n: {},
        fileConfig: { allowedTypes: ['image/*'], maxSizeMb: 10 },
      }).success,
    ).toBe(true);
  });

  it('rejects file without config', () => {
    expect(
      questionSchema.safeParse({
        key: 'foto',
        type: 'file',
        required: false,
        i18n: {},
      }).success,
    ).toBe(false);
  });

  it('rejects bad key (uppercase or starting with digit)', () => {
    expect(
      questionSchema.safeParse({
        key: 'Tipo',
        type: 'text',
        required: false,
        i18n: {},
      }).success,
    ).toBe(false);
    expect(
      questionSchema.safeParse({
        key: '1tipo',
        type: 'text',
        required: false,
        i18n: {},
      }).success,
    ).toBe(false);
  });
});

describe('saveQuestionsSchema', () => {
  it('accepts empty array with target=client', () => {
    expect(
      saveQuestionsSchema.safeParse({ serviceId: validUuid, target: 'client', questions: [] })
        .success,
    ).toBe(true);
  });

  it('accepts empty array with target=talent', () => {
    expect(
      saveQuestionsSchema.safeParse({ serviceId: validUuid, target: 'talent', questions: [] })
        .success,
    ).toBe(true);
  });

  it('rejects unknown target', () => {
    expect(
      saveQuestionsSchema.safeParse({ serviceId: validUuid, target: 'admin', questions: [] })
        .success,
    ).toBe(false);
  });

  it('rejects missing target', () => {
    expect(saveQuestionsSchema.safeParse({ serviceId: validUuid, questions: [] }).success).toBe(
      false,
    );
  });

  it('rejects duplicate keys', () => {
    expect(
      saveQuestionsSchema.safeParse({
        serviceId: validUuid,
        target: 'client',
        questions: [
          { key: 'a', type: 'text', required: false, i18n: {} },
          { key: 'a', type: 'number', required: false, i18n: {} },
        ],
      }).success,
    ).toBe(false);
  });

  it('rejects invalid serviceId', () => {
    expect(
      saveQuestionsSchema.safeParse({ serviceId: 'nope', target: 'client', questions: [] })
        .success,
    ).toBe(false);
  });
});
