import type { FormSchema, FormTranslationData } from './types';

/**
 * Returns the set of valid translation keys from a form schema.
 * Includes: step keys, field keys, action keys.
 */
function getValidTranslationKeys(schema: FormSchema): Set<string> {
  const keys = new Set<string>();
  for (const step of schema.steps) {
    keys.add(step.key);
    for (const field of step.fields) {
      keys.add(field.key);
    }
    for (const action of step.actions ?? []) {
      keys.add(action.key);
    }
  }
  return keys;
}

function filterByKeys(
  obj: Record<string, string>,
  validKeys: Set<string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (validKeys.has(key)) {
      result[key] = value;
    }
  }
  return result;
}

function filterOptionLabels(
  obj: Record<string, string>,
  validKeys: Set<string>,
): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const fieldKey = key.split('.')[0];
    if (validKeys.has(fieldKey)) {
      result[key] = value;
    }
  }
  return result;
}

/**
 * Removes orphaned translation entries that don't correspond to any
 * step, field, or action in the current schema. Works across all locales.
 */
export function sanitizeTranslations(
  schema: FormSchema,
  translations: Record<string, FormTranslationData>,
): Record<string, FormTranslationData> {
  const validKeys = getValidTranslationKeys(schema);
  const result: Record<string, FormTranslationData> = {};

  for (const [locale, trans] of Object.entries(translations)) {
    result[locale] = {
      labels: filterByKeys(trans.labels, validKeys),
      placeholders: filterByKeys(trans.placeholders, validKeys),
      option_labels: filterOptionLabels(trans.option_labels, validKeys),
    };
  }

  return result;
}
