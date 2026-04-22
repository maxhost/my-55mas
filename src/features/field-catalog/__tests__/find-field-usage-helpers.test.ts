import { describe, it, expect } from 'vitest';
import { extractFieldIds } from '../actions/find-field-usage-helpers';

describe('extractFieldIds', () => {
  it('returns empty set for null schema', () => {
    expect(extractFieldIds(null).size).toBe(0);
  });

  it('returns empty set for schema without steps', () => {
    expect(extractFieldIds({}).size).toBe(0);
  });

  it('returns empty set when steps is not an array', () => {
    expect(extractFieldIds({ steps: 'foo' }).size).toBe(0);
  });

  it('extracts field_definition_ids from multi-step schema', () => {
    const result = extractFieldIds({
      steps: [
        {
          key: 'step1',
          field_refs: [
            { field_definition_id: 'id-1', required: true },
            { field_definition_id: 'id-2', required: false },
          ],
        },
        {
          key: 'step2',
          field_refs: [{ field_definition_id: 'id-3', required: true }],
        },
      ],
    });
    expect(Array.from(result).sort()).toEqual(['id-1', 'id-2', 'id-3']);
  });

  it('deduplicates repeated ids across steps', () => {
    const result = extractFieldIds({
      steps: [
        { field_refs: [{ field_definition_id: 'id-1' }] },
        { field_refs: [{ field_definition_id: 'id-1' }] },
      ],
    });
    expect(result.size).toBe(1);
  });

  it('tolerates steps with missing or non-array field_refs', () => {
    const result = extractFieldIds({
      steps: [
        { key: 's1' },
        { key: 's2', field_refs: null },
        { key: 's3', field_refs: [{ field_definition_id: 'id-1' }] },
      ],
    });
    expect(Array.from(result)).toEqual(['id-1']);
  });

  it('ignores refs with non-string field_definition_id', () => {
    const result = extractFieldIds({
      steps: [
        {
          field_refs: [
            { field_definition_id: 123 },
            { field_definition_id: 'ok' },
          ],
        },
      ],
    });
    expect(Array.from(result)).toEqual(['ok']);
  });
});
