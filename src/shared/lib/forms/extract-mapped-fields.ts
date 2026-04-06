import type { FormSchema } from './types';

type ExtractionResult = {
  unmapped: Record<string, unknown>;
  [table: string]: Record<string, unknown>;
};

/**
 * Extracts db_column field values from form data, grouped by target table.
 * Non-db_column fields go into `unmapped`.
 *
 * Values that are undefined or null are omitted from mapped tables.
 * Boolean false and empty strings ARE included (they are valid values).
 */
export function extractMappedFields(
  schema: FormSchema,
  formData: Record<string, unknown>,
): ExtractionResult {
  const result: ExtractionResult = { unmapped: {} };
  const mappedKeys = new Set<string>();

  for (const step of schema.steps) {
    for (const field of step.fields) {
      if (field.type === 'db_column' && field.db_table && field.db_column) {
        const value = formData[field.key];
        if (value === undefined || value === null) continue;

        if (!result[field.db_table]) {
          result[field.db_table] = {};
        }
        result[field.db_table][field.db_column] = value;
        mappedKeys.add(field.key);
      }
    }
  }

  // Everything not mapped goes to unmapped
  for (const [key, value] of Object.entries(formData)) {
    if (!mappedKeys.has(key)) {
      result.unmapped[key] = value;
    }
  }

  return result;
}
