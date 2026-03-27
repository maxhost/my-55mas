import type { FormSchema, FormStep, FormField, FormTranslationData } from './types';

// ── Field key extraction ─────────────────────────────────

function allFieldKeys(schema: FormSchema): Set<string> {
  const keys = new Set<string>();
  for (const step of schema.steps) {
    for (const field of step.fields) {
      keys.add(field.key);
    }
  }
  return keys;
}

function allStepKeys(schema: FormSchema): Set<string> {
  return new Set(schema.steps.map((s) => s.key));
}

/**
 * Returns field keys that exist in the variant schema but NOT in the old General schema.
 * These are "variant-specific" fields that must be preserved during cascade.
 */
export function getVariantOnlyFieldKeys(
  oldGeneral: FormSchema,
  variant: FormSchema,
): Set<string> {
  const generalKeys = allFieldKeys(oldGeneral);
  const variantKeys = allFieldKeys(variant);
  const result = new Set<string>();
  Array.from(variantKeys).forEach((key) => {
    if (!generalKeys.has(key)) result.add(key);
  });
  return result;
}

// ── Schema cascade ───────────────────────────────────────

/**
 * Merges the new General schema into a country schema, preserving country-specific fields.
 *
 * Algorithm:
 * 1. Start with new General's steps in General's order
 * 2. For each step that also exists in country: append country-specific fields
 * 3. Append entirely country-specific steps at the end
 */
export function cascadeSchema(
  oldGeneral: FormSchema,
  newGeneral: FormSchema,
  country: FormSchema,
): FormSchema {
  const countryOnlyFields = getVariantOnlyFieldKeys(oldGeneral, country);
  const newGeneralStepKeys = allStepKeys(newGeneral);
  const oldGeneralStepKeys = allStepKeys(oldGeneral);

  // Index country steps by key for quick lookup
  const countryStepMap = new Map<string, FormStep>();
  for (const step of country.steps) {
    countryStepMap.set(step.key, step);
  }

  // Build merged steps: General steps + country-specific fields
  const mergedSteps: FormStep[] = newGeneral.steps.map((genStep) => {
    const countryStep = countryStepMap.get(genStep.key);
    if (!countryStep) return structuredClone(genStep);

    // General fields (from new General) + country-specific fields appended
    const countrySpecificFields: FormField[] = countryStep.fields.filter(
      (f) => countryOnlyFields.has(f.key),
    );

    return {
      key: genStep.key,
      fields: [...structuredClone(genStep.fields), ...structuredClone(countrySpecificFields)],
    };
  });

  // Append country-specific steps (not in General, and not inherited from old General)
  for (const step of country.steps) {
    if (!newGeneralStepKeys.has(step.key) && !oldGeneralStepKeys.has(step.key)) {
      mergedSteps.push(structuredClone(step));
    }
  }

  return { steps: mergedSteps };
}

// ── Translation cascade ──────────────────────────────────

type TranslationsMap = Record<string, FormTranslationData>;

function emptyTranslation(): FormTranslationData {
  return { labels: {}, placeholders: {}, option_labels: {} };
}

function mergeBucket(
  oldGen: Record<string, string>,
  newGen: Record<string, string>,
  country: Record<string, string>,
  countryOnlyKeys: Set<string>,
): Record<string, string> {
  const result: Record<string, string> = {};

  // Start with country values for country-specific keys
  for (const key of Object.keys(country)) {
    if (countryOnlyKeys.has(key) || countryOnlyKeys.has(key.split('.')[0])) {
      result[key] = country[key];
    }
  }

  // Process General keys
  for (const key of Object.keys(newGen)) {
    if (!(key in oldGen)) {
      // New key in General -> copy to country
      result[key] = newGen[key];
    } else if (oldGen[key] !== newGen[key]) {
      // General changed this value
      if (country[key] === oldGen[key] || country[key] === undefined) {
        result[key] = newGen[key]; // inherited -> update
      } else {
        result[key] = country[key]; // customized -> preserve
      }
    } else {
      // General unchanged -> keep country's value (or General's if country missing)
      result[key] = country[key] ?? newGen[key];
    }
  }

  return result;
}

/**
 * Cascades translation changes from General to a country form.
 * - New keys: copied from General
 * - Changed keys: updated if country still had old inherited value, preserved if customized
 * - Removed keys: cleaned up (unless country-specific)
 */
export function cascadeTranslations(
  oldGeneral: TranslationsMap,
  newGeneral: TranslationsMap,
  country: TranslationsMap,
  countryOnlyFieldKeys: Set<string>,
): TranslationsMap {
  const result: TranslationsMap = {};

  // Process all locales from both General and country
  const allLocales = new Set([
    ...Object.keys(newGeneral),
    ...Object.keys(country),
  ]);

  Array.from(allLocales).forEach((locale) => {
    const oldGen = oldGeneral[locale] ?? emptyTranslation();
    const newGen = newGeneral[locale] ?? emptyTranslation();
    const ctry = country[locale] ?? emptyTranslation();

    result[locale] = {
      labels: mergeBucket(oldGen.labels, newGen.labels, ctry.labels, countryOnlyFieldKeys),
      placeholders: mergeBucket(oldGen.placeholders, newGen.placeholders, ctry.placeholders, countryOnlyFieldKeys),
      option_labels: mergeBucket(oldGen.option_labels, newGen.option_labels, ctry.option_labels, countryOnlyFieldKeys),
    };
  });

  return result;
}
