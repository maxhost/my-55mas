import { describe, it, expect } from 'vitest';
import { isEmptySchema, isLegacySchema } from '../empty-schema-check';
import type { ResolvedForm } from '@/shared/lib/field-catalog/resolved-types';

describe('isEmptySchema', () => {
  it('returns true when there are no steps', () => {
    expect(isEmptySchema({ steps: [] })).toBe(true);
  });

  it('returns true when steps exist but have no fields', () => {
    const form: ResolvedForm = {
      steps: [
        { key: 's1', label: 'Step 1', fields: [] },
        { key: 's2', label: 'Step 2', fields: [] },
      ],
    };
    expect(isEmptySchema(form)).toBe(true);
  });

  it('returns false when at least one step has fields', () => {
    const form: ResolvedForm = {
      steps: [
        { key: 's1', label: 'Step 1', fields: [] },
        {
          key: 's2',
          label: 'Step 2',
          fields: [
            {
              field_definition_id: 'fd-1',
              key: 'k',
              input_type: 'text',
              persistence_type: 'form_response',
              persistence_target: null,
              required: false,
              label: 'L',
              placeholder: '',
              options: null,
              options_source: null,
            },
          ],
        },
      ],
    };
    expect(isEmptySchema(form)).toBe(false);
  });
});

describe('isLegacySchema', () => {
  it('returns true for null/undefined', () => {
    expect(isLegacySchema(null)).toBe(true);
    expect(isLegacySchema(undefined)).toBe(true);
  });

  it('returns true for non-object inputs', () => {
    expect(isLegacySchema('not an object')).toBe(true);
    expect(isLegacySchema(42)).toBe(true);
  });

  it('returns true when "steps" key is missing', () => {
    expect(isLegacySchema({})).toBe(true);
    expect(isLegacySchema({ fields: [] })).toBe(true);
  });

  it('returns true when "steps" is not an array', () => {
    expect(isLegacySchema({ steps: 'oops' })).toBe(true);
    expect(isLegacySchema({ steps: { nested: true } })).toBe(true);
  });

  it('returns true when a step has no field_refs (legacy FormField[] inline)', () => {
    expect(isLegacySchema({ steps: [{ key: 's1', fields: [] }] })).toBe(true);
  });

  it('returns false for valid CatalogFormSchema shape', () => {
    expect(
      isLegacySchema({
        steps: [
          { key: 's1', field_refs: [] },
          {
            key: 's2',
            field_refs: [{ field_definition_id: 'uuid', required: false }],
          },
        ],
      })
    ).toBe(false);
  });

  it('returns false for empty steps array (still valid CatalogFormSchema)', () => {
    expect(isLegacySchema({ steps: [] })).toBe(false);
  });
});
